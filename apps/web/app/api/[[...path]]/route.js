import { MongoClient, ObjectId } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v2 as cloudinary } from 'cloudinary'
import nodemailer from 'nodemailer'

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

let client
let db
let seeded = false

async function connectToMongo() {
  const url = process.env.MONGO_URL
  if (!url) {
    console.warn('⚠️ connectToMongo: No MONGO_URL specified in environment.')
    return null
  }
  
  if (!client) {
    try {
      client = new MongoClient(url, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        maxPoolSize: 10,
        minPoolSize: 1
      })
      await client.connect()
      console.log('✅ Connected to MongoDB successfully.')
    } catch (err) {
      console.error('❌ Failed to connect to MongoDB:', err.message)
      client = null
      return null
    }
  }
  if (!db && client) {
    db = client.db(process.env.DB_NAME || 'wardrobe_talks')
  }
  return db
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'local_auth_secret_secure_key_12345'

function escapeRegex(string) {
  if (typeof string !== 'string') return ''
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Response Formatter Helpers
function sendSuccess(data, status = 200) {
  return handleCORS(NextResponse.json({ success: true, data }, { status }))
}

function sendError(code, message, status = 400) {
  return handleCORS(NextResponse.json({
    success: false,
    error: { code, message }
  }, { status }))
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Token/Role Validation
function verifyAdmin(request, requiredRoles = []) {
  let token = null
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  if (!token) {
    const cookie = request.cookies.get('wt_session')
    if (cookie) token = cookie.value
  }

  if (!token) {
  console.error('🔑 verifyAdmin: No token found')
  throw new Error('UNAUTHORIZED')
}

  try {
    const decoded = jwt.verify(token, AUTH_SECRET)
    if (!decoded || !decoded.role) throw new Error('UNAUTHORIZED')
    if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
      throw new Error('FORBIDDEN')
    }
    return decoded
  } catch (err) {
    if (err.message === 'FORBIDDEN') throw err
    throw new Error('UNAUTHORIZED')
  }
}

// Flat-file Database Fallback Helpers
function getInMemoryStore() {
  if (!global.inMemoryStore) {
    global.inMemoryStore = {}
  }
  return global.inMemoryStore
}

function readBackupData(collectionName) {
  const store = getInMemoryStore()
  if (store[collectionName] !== undefined && Array.isArray(store[collectionName])) {
    return store[collectionName]
  }

  const pathsToTry = [
    '/tmp/db_backup.json',
    path.join(process.cwd(), 'db_backup.json'),
    path.join(process.cwd(), 'apps', 'web', 'db_backup.json'),
    path.join(process.cwd(), '..', 'db_backup.json'),
    path.join(__dirname, 'db_backup.json'),
    path.join(__dirname, '..', '..', '..', '..', '..', 'db_backup.json')
  ]

  for (const backupPath of pathsToTry) {
    try {
      if (fs.existsSync(backupPath)) {
        const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        if (backupData && backupData[collectionName]) {
          store[collectionName] = backupData[collectionName]
          return store[collectionName]
        }
      }
    } catch (err) {
      console.error(`Failed to read backup from ${backupPath}:`, err)
    }
  }

  store[collectionName] = []
  return store[collectionName]
}

function writeBackupData(collectionName, data) {
  const store = getInMemoryStore()
  store[collectionName] = data

  const pathsToTry = [
    '/tmp/db_backup.json',
    path.join(process.cwd(), 'db_backup.json')
  ]

  for (const backupPath of pathsToTry) {
    try {
      let backupContent = {}
      if (fs.existsSync(backupPath)) {
        try {
          backupContent = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        } catch (e) {}
      }
      backupContent[collectionName] = data
      fs.writeFileSync(backupPath, JSON.stringify(backupContent, null, 2), 'utf8')
      break
    } catch (err) {
      // Ignore write failures on read-only serverless file systems
    }
  }
}

// Helper to generate unique slugs
async function generateUniqueSlug(db, collectionName, title, originalSlug) {
  let slug = originalSlug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  if (!slug) slug = 'unnamed'
  let count = 0
  let uniqueSlug = slug
  while (true) {
    let exists = false
    if (db) {
      try {
        exists = await db.collection(collectionName).findOne({ slug: uniqueSlug })
      } catch (e) {
        exists = false
      }
    } else {
      const localData = readBackupData(collectionName)
      exists = Array.isArray(localData) && localData.some(item => item && item.slug === uniqueSlug)
    }
    if (!exists) return uniqueSlug
    count++
    uniqueSlug = `${slug}-${count}`
  }
}

// Stream upload logic for files
async function uploadToCloudinary(fileBuffer, mimeType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'wardrobe_talks',
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    uploadStream.end(fileBuffer)
  })
}

// Inquiry Email Forwarder
async function sendInquiryEmail(inquiry) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, INQUIRY_TO } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !INQUIRY_TO) {
    console.log('SMTP config missing, skipping inquiry email forwarding.')
    return
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10),
      secure: parseInt(SMTP_PORT, 10) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })

    const mailOptions = {
      from: `"Wardrobe Talks" <${SMTP_USER}>`,
      to: INQUIRY_TO,
      subject: `New Lookbook Enquiry from ${inquiry.name}`,
      text: `
Name: ${inquiry.name}
Email: ${inquiry.email}
Phone: ${inquiry.phone || 'N/A'}
Message: ${inquiry.message}
Product: ${inquiry.productTitle || 'N/A'}
Date: ${new Date(inquiry.createdAt).toLocaleString()}
`,
      html: `
<h3>New Lookbook Enquiry Received</h3>
<p><strong>Name:</strong> ${inquiry.name}</p>
<p><strong>Email:</strong> ${inquiry.email}</p>
<p><strong>Phone:</strong> ${inquiry.phone || 'N/A'}</p>
<p><strong>Product Interest:</strong> ${inquiry.productTitle || 'N/A'}</p>
<p><strong>Message:</strong> ${inquiry.message}</p>
<p><strong>Date:</strong> ${new Date(inquiry.createdAt).toLocaleString()}</p>
`
    }
    await transporter.sendMail(mailOptions)
    console.log(`Successfully forwarded inquiry to ${INQUIRY_TO}`)
  } catch (err) {
    console.error('SMTP Error sending inquiry email:', err.message)
  }
}

// Database Seeder
async function seedProducts(db) {
  if (seeded) return
  seeded = true

  try {
    // Indexes
    await db.collection('products').createIndex({ slug: 1 }, { unique: true, sparse: true })
    await db.collection('products').createIndex({ category: 1 })
    await db.collection('products').createIndex({ featured: 1 })
    await db.collection('products').createIndex({ published: 1 })
    await db.collection('products').createIndex({ createdAt: -1 })
    await db.collection('blogs').createIndex({ slug: 1 }, { unique: true, sparse: true })
    await db.collection('blogs').createIndex({ status: 1 })
    await db.collection('blogs').createIndex({ createdAt: -1 })
    await db.collection('inquiries').createIndex({ status: 1 })
    await db.collection('inquiries').createIndex({ createdAt: -1 })
    await db.collection('admins').createIndex({ email: 1 }, { unique: true })
  } catch (e) {
    console.log('Database indexes verification completed with warnings.')
  }

  // Seed default admin if none exist
  const adminsCount = await db.collection('admins').countDocuments()
  if (adminsCount === 0) {
    await db.collection('admins').insertOne({
      id: uuidv4(),
      email: 'admin@wardrobetalks.com',
      passwordHash: bcrypt.hashSync('wardrobe@2025', 10),
      role: 'SUPER_ADMIN',
      name: 'Super Admin',
      createdAt: new Date()
    })
  }

  let backupData = null
  try {
    const pathsToTry = [
      path.join(process.cwd(), 'db_backup.json'),
      path.join(process.cwd(), 'apps', 'web', 'db_backup.json'),
      path.join(process.cwd(), '..', 'db_backup.json'),
      path.join(__dirname, 'db_backup.json'),
      path.join(__dirname, '..', '..', '..', '..', '..', 'db_backup.json')
    ]
    for (const backupPath of pathsToTry) {
      if (fs.existsSync(backupPath)) {
        backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
        if (backupData) break
      }
    }
  } catch (err) {
    console.error('Failed to read db_backup.json:', err)
  }

  if (backupData) {
    const settingsCount = await db.collection('settings').countDocuments()
    if (settingsCount === 0 && backupData.settings && backupData.settings.length > 0) {
      await db.collection('settings').insertMany(backupData.settings.map(({ _id, ...s }) => s))
    }
    const productsCount = await db.collection('products').countDocuments()
    if (productsCount === 0 && backupData.products && backupData.products.length > 0) {
      await db.collection('products').insertMany(backupData.products.map(({ _id, ...p }) => ({
        ...p,
        createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        slug: p.slug || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      })))
    }
    const blogsCount = await db.collection('blogs').countDocuments()
    if (blogsCount === 0 && backupData.blogs && backupData.blogs.length > 0) {
      await db.collection('blogs').insertMany(backupData.blogs.map(({ _id, ...b }) => ({
        ...b,
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        slug: b.slug || b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      })))
    }
    const galleryCount = await db.collection('gallery').countDocuments()
    if (galleryCount === 0 && backupData.gallery && backupData.gallery.length > 0) {
      await db.collection('gallery').insertMany(backupData.gallery.map(({ _id, ...g }) => ({
        ...g,
        createdAt: g.createdAt ? new Date(g.createdAt) : new Date()
      })))
    }
    const heroSlidesCount = await db.collection('heroSlides').countDocuments()
    if (heroSlidesCount === 0 && backupData.heroSlides && backupData.heroSlides.length > 0) {
      await db.collection('heroSlides').insertMany(backupData.heroSlides.map(({ _id, ...h }) => ({
        ...h,
        createdAt: h.createdAt ? new Date(h.createdAt) : new Date()
      })))
    }
    return
  }

  // Fallback Seeder defaults
  const defaultSettings = {
    whatsappNumber: '+919885525611',
    whatsappCommunity: 'https://chat.whatsapp.com/KwfqIRFfq9TIR3O657M0EZ',
    instagramUrl: 'https://www.instagram.com/wardrobe.talks?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==',
    facebookUrl: '',
    youtubeUrl: '',
    inquiryEmail: '',
    storeAddress: '12, Linking Road, Bandra West, Mumbai 400050',
    storeMapsUrl: 'https://www.google.com/maps/search/?api=1&query=12+Linking+Road+Bandra+West+Mumbai+400050',
    brandTagline: 'Where threads tell stories.',
    heroHeadline: 'Couture, Quietly Spoken.',
    heroSubtext: 'A Hydrabad atelier crafting heirloom Indian wear since 2020.',
  }
  const exists = await db.collection('settings').findOne({ id: 'main' })
  if (!exists) {
    await db.collection('settings').insertOne({ id: 'main', ...defaultSettings })
  }
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  let db = null
  try {
    db = await connectToMongo()
    if (db) await seedProducts(db)
  } catch (err) {
    console.warn('MongoDB connection failed, falling back to local JSON data:', err.message)
    db = null
  }

  try {
    // Health Check
    if ((route === '/' || route === '/root') && method === 'GET') {
      return sendSuccess({ status: 'live', dbConnected: !!db })
    }

    // AUTH LOGIN
    if (route === '/auth/login' && method === 'POST') {
      const { email, password } = await request.json()
      if (!email || !password) return sendError('VALIDATION_ERROR', 'Email and password are required.')

      let admin = null
      if (db) {
        admin = await db.collection('admins').findOne({ email: email.toLowerCase() })
      } else {
        const localAdmins = readBackupData('admins')
        admin = localAdmins.find(a => a.email === email.toLowerCase())
      }

      // Default super admin fallback if admin not found in DB or backup JSON
      if (!admin) {
        if (email.toLowerCase() === 'admin@wardrobetalks.com') {
          admin = {
            id: 'default-super-admin-id',
            email: 'admin@wardrobetalks.com',
            passwordHash: bcrypt.hashSync('wardrobe@2025', 10),
            role: 'SUPER_ADMIN',
            name: 'Super Admin',
            createdAt: new Date()
          }
          if (db) {
            try { await db.collection('admins').insertOne(admin) } catch (e) {}
          }
        }
      }

      if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
        return sendError('UNAUTHORIZED', 'Invalid email or password.', 401)
      }

      const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, AUTH_SECRET, { expiresIn: '7d' })
      const response = NextResponse.json({
        success: true,
        data: { token, role: admin.role, name: admin.name }
      })
      response.cookies.set('wt_session', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/'
      })
      return handleCORS(response)
    }

    // PUBLIC: GET SETTINGS
    if (route === '/settings' && method === 'GET') {
      let s = null
      if (db) {
        s = await db.collection('settings').findOne({ id: 'main' })
      } else {
        const localSettings = readBackupData('settings')
        s = localSettings.find(item => item.id === 'main')
      }
      if (!s) return sendSuccess({})
      const { _id, ...rest } = s
      return sendSuccess(rest)
    }

    // PUBLIC: GET PRODUCTS
    if (route === '/products' && method === 'GET') {
      const url = new URL(request.url)
      const category = url.searchParams.get('category')
      const subcategory = url.searchParams.get('subcategory')
      const featured = url.searchParams.get('featured')
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '40', 10)
      const skip = (page - 1) * limit

      let items = []
      let total = 0

      if (db) {
        const query = { published: { $ne: false } }
        if (category) query.category = category
        if (subcategory) query.subcategory = subcategory
        if (featured === 'true') query.featured = true

        total = await db.collection('products').countDocuments(query)
        items = await db.collection('products').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
      } else {
        const localData = readBackupData('products')
        const filtered = localData.filter(p => {
          if (p.published === false) return false
          if (category && p.category !== category) return false
          if (subcategory && p.subcategory !== subcategory) return false
          if (featured === 'true' && !p.featured) return false
          return true
        })
        total = filtered.length
        items = filtered.slice(skip, skip + limit)
      }

      return sendSuccess({
        items: items.map(({ _id, ...r }) => r),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    }

    // PUBLIC: GET PRODUCT DETAIL BY ID/SLUG
    if (route.startsWith('/products/') && method === 'GET') {
      const idOrSlug = route.split('/')[2]
      let product = null
      let related = []

      if (db) {
        product = await db.collection('products').findOne({ $or: [{ id: idOrSlug }, { slug: idOrSlug }] })
        if (product) {
          related = await db.collection('products')
            .find({ subcategory: product.subcategory, id: { $ne: product.id }, published: { $ne: false } })
            .limit(4).toArray()
        }
      } else {
        const localData = readBackupData('products')
        product = localData.find(p => p.id === idOrSlug || p.slug === idOrSlug)
        if (product) {
          related = localData.filter(p => p.subcategory === product.subcategory && p.id !== product.id && p.published !== false).slice(0, 4)
        }
      }

      if (!product) return sendError('NOT_FOUND', 'Product not found.', 404)
      const { _id, ...rest } = product
      return sendSuccess({ ...rest, related: related.map(({ _id, ...r }) => r) })
    }

    // PUBLIC: GET HERO SLIDES
    if (route === '/hero' && method === 'GET') {
      let items = []
      if (db) {
        items = await db.collection('heroSlides').find({ active: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray()
      } else {
        items = readBackupData('heroSlides').filter(h => h.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
      }
      return sendSuccess(items.map(({ _id, ...r }) => r))
    }

    // PUBLIC: GET GALLERY
    if (route === '/gallery' && method === 'GET') {
      let items = []
      if (db) {
        items = await db.collection('gallery').find({ published: { $ne: false } }).sort({ order: 1, createdAt: 1 }).toArray()
      } else {
        items = readBackupData('gallery').filter(g => g.published !== false).sort((a, b) => (a.order || 0) - (b.order || 0))
      }
      return sendSuccess(items.map(({ _id, ...r }) => r))
    }

    // PUBLIC: GET BLOGS
    if (route === '/blogs' && method === 'GET') {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '12', 10)
      const skip = (page - 1) * limit

      let items = []
      let total = 0

      if (db) {
        const query = { status: 'published' }
        total = await db.collection('blogs').countDocuments(query)
        items = await db.collection('blogs').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
      } else {
        const localData = readBackupData('blogs').filter(b => b.status === 'published')
        total = localData.length
        items = localData.slice(skip, skip + limit)
      }

      return sendSuccess({
        items: items.map(({ _id, ...r }) => r),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    }

    // PUBLIC: GET BLOG DETAIL BY ID/SLUG
    if (route.startsWith('/blogs/') && method === 'GET') {
      const idOrSlug = route.split('/')[2]
      let blog = null

      if (db) {
        blog = await db.collection('blogs').findOne({ $or: [{ id: idOrSlug }, { slug: idOrSlug }] })
      } else {
        const localData = readBackupData('blogs')
        blog = localData.find(b => b.id === idOrSlug || b.slug === idOrSlug)
      }

      if (!blog) return sendError('NOT_FOUND', 'Blog not found.', 404)
      const { _id, ...rest } = blog
      return sendSuccess(rest)
    }

    // PUBLIC: POST INQUIRY
    if (route === '/inquiries' && method === 'POST') {
      const body = await request.json()
      if (!body.name || !body.email || !body.message) {
        return sendError('VALIDATION_ERROR', 'Missing required fields: name, email, and message.')
      }

      const doc = {
        id: uuidv4(),
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        message: body.message,
        productId: body.productId || '',
        productTitle: body.productTitle || '',
        status: 'NEW',
        createdAt: new Date()
      }

      if (db) {
        await db.collection('inquiries').insertOne(doc)
      } else {
        const localData = readBackupData('inquiries')
        localData.push(doc)
        writeBackupData('inquiries', localData)
      }

      // Send email forwarding in background
      sendInquiryEmail(doc)

      return sendSuccess(doc, 201)
    }

    // ==========================================
    // SECURE ADMIN ENDPOINTS (Require Authorization)
    // ==========================================

    // ADMIN: GET STATS
    if (route === '/admin/dashboard/stats' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER', 'INQUIRY_MANAGER'])

      let stats = {}
      if (db) {
        const [totalProducts, totalCollections, featuredProducts, totalInquiries, newInquiries, publishedBlogs, galleryImages] = await Promise.all([
          db.collection('products').countDocuments(),
          db.collection('products').distinct('category').then(cats => cats.length),
          db.collection('products').countDocuments({ featured: true }),
          db.collection('inquiries').countDocuments(),
          db.collection('inquiries').countDocuments({ status: 'NEW' }),
          db.collection('blogs').countDocuments({ status: 'published' }),
          db.collection('gallery').countDocuments()
        ])

        const recentInquiries = await db.collection('inquiries').find({}).sort({ createdAt: -1 }).limit(5).toArray()
        const recentProducts = await db.collection('products').find({}).sort({ createdAt: -1 }).limit(5).toArray()

        stats = {
          totalProducts,
          totalCollections,
          featuredProducts,
          totalInquiries,
          newInquiries,
          publishedBlogs,
          galleryImages,
          recentInquiries: recentInquiries.map(({ _id, ...r }) => r),
          recentProducts: recentProducts.map(({ _id, ...r }) => r),
          systemStatus: {
            database: 'CONNECTED',
            cloudinary: process.env.CLOUDINARY_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
            smtp: process.env.SMTP_HOST ? 'CONFIGURED' : 'NOT_CONFIGURED'
          }
        }
      } else {
        const products = readBackupData('products')
        const inquiries = readBackupData('inquiries')
        const blogs = readBackupData('blogs')
        const gallery = readBackupData('gallery')

        stats = {
          totalProducts: products.length,
          totalCollections: [...new Set(products.map(p => p.category))].length,
          featuredProducts: products.filter(p => p.featured).length,
          totalInquiries: inquiries.length,
          newInquiries: inquiries.filter(i => i.status === 'NEW').length,
          publishedBlogs: blogs.filter(b => b.status === 'published').length,
          galleryImages: gallery.length,
          recentInquiries: inquiries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          recentProducts: products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
          systemStatus: {
            database: 'FALLBACK_LOCAL_JSON',
            cloudinary: process.env.CLOUDINARY_API_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED',
            smtp: process.env.SMTP_HOST ? 'CONFIGURED' : 'NOT_CONFIGURED'
          }
        }
      }
      return sendSuccess(stats)
    }

    // ADMIN: IMAGE FILE UPLOAD TO CLOUDINARY
    if (route === '/admin/upload' && method === 'POST') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])

      const formData = await request.formData()
      const file = formData.get('file')
      if (!file) return sendError('VALIDATION_ERROR', 'No file was provided.')

      // Validate size limit (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return sendError('VALIDATION_ERROR', 'File size exceeds limit of 10MB.')
      }

      // Validate MIME type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/avif']
      if (!allowedTypes.includes(file.type)) {
        return sendError('VALIDATION_ERROR', 'Invalid file type. Only JPEG, PNG, GIF, WEBP, HEIC, and AVIF images are allowed.')
      }

      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const uploadResult = await uploadToCloudinary(buffer, file.type)
        return sendSuccess({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          format: uploadResult.format,
          width: uploadResult.width,
          height: uploadResult.height
        })
      } catch (err) {
        console.error('Cloudinary upload failure:', err.message)
        return sendError('IMAGE_UPLOAD_FAILED', `Failed to upload image: ${err.message}`, 500)
      }
    }

    // ADMIN: PRODUCTS CRUD
    if (route === '/admin/products' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '20', 10)
      const q = url.searchParams.get('q')
      const category = url.searchParams.get('category')
      const skip = (page - 1) * limit

      let items = []
      let total = 0

      if (db) {
        const query = {}
        if (category) query.category = category
        if (q) {
          const safeQ = escapeRegex(q)
          query.$or = [
            { title: { $regex: safeQ, $options: 'i' } },
            { description: { $regex: safeQ, $options: 'i' } }
          ]
        }
        total = await db.collection('products').countDocuments(query)
        items = await db.collection('products').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
      } else {
        const localData = readBackupData('products')
        const filtered = localData.filter(p => {
          if (category && p.category !== category) return false
          if (q && !(p.title?.toLowerCase().includes(q.toLowerCase()) || p.description?.toLowerCase().includes(q.toLowerCase()))) return false
          return true
        })
        total = filtered.length
        items = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(skip, skip + limit)
      }

      return sendSuccess({
        items: items.map(({ _id, ...r }) => r),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    }

    if (route === '/admin/products' && method === 'POST') {
      console.log('🛠️ Admin product creation called')
      // Token verification performed by verifyAdmin()
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const body = await request.json()
      console.log('Request body:', JSON.stringify(body, null, 2))
      if (!body.title) {
        console.error('Validation error: missing title')
        return sendError('VALIDATION_ERROR', 'Product title is required.')
      }

      const slug = await generateUniqueSlug(db, 'products', body.title, body.slug)
      console.log('Generated slug:', slug)

      const doc = {
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        published: true,
        featured: false,
        displayOrder: 999,
        images: [],
        ...body,
        slug
      }
      console.log('Prepared product document:', JSON.stringify(doc, null, 2))

      if (db) {
        console.log('Inserting product into MongoDB')
        await db.collection('products').insertOne(doc)
      } else {
        console.log('Using fallback local store')
        const localData = readBackupData('products')
        localData.push(doc)
        writeBackupData('products', localData)
        console.log('Product written to fallback backup')
      }
      console.log('Product creation successful, returning response')
      return sendSuccess(doc, 201)
    }

    if (route.startsWith('/admin/products/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]
      const body = await request.json()
      delete body._id; delete body.id
      body.updatedAt = new Date()

      if (db) {
        const existing = await db.collection('products').findOne({ id })
        if (!existing) return sendError('NOT_FOUND', 'Product not found.', 404)
        if (body.title && body.title !== existing.title && !body.slug) {
          body.slug = await generateUniqueSlug(db, 'products', body.title)
        }
        await db.collection('products').updateOne({ id }, { $set: body })
      } else {
        const localData = readBackupData('products')
        const idx = localData.findIndex(p => p.id === id)
        if (idx === -1) return sendError('NOT_FOUND', 'Product not found.', 404)
        localData[idx] = { ...localData[idx], ...body }
        writeBackupData('products', localData)
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/products/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]

      if (db) {
        const result = await db.collection('products').deleteOne({ id })
        if (result.deletedCount === 0) return sendError('NOT_FOUND', 'Product not found.', 404)
      } else {
        const localData = readBackupData('products')
        const filtered = localData.filter(p => p.id !== id)
        if (filtered.length === localData.length) return sendError('NOT_FOUND', 'Product not found.', 404)
        writeBackupData('products', filtered)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: INQUIRIES CRUD
    if (route === '/admin/inquiries' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'INQUIRY_MANAGER'])
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '20', 10)
      const status = url.searchParams.get('status')
      const q = url.searchParams.get('q')
      const skip = (page - 1) * limit

      let items = []
      let total = 0

      if (db) {
        const query = {}
        if (status) query.status = status
        if (q) {
          query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } },
            { message: { $regex: q, $options: 'i' } }
          ]
        }
        total = await db.collection('inquiries').countDocuments(query)
        items = await db.collection('inquiries').find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
      } else {
        const localData = readBackupData('inquiries')
        const filtered = localData.filter(i => {
          if (status && i.status !== status) return false
          if (q && !(i.name?.toLowerCase().includes(q.toLowerCase()) || i.email?.toLowerCase().includes(q.toLowerCase()) || i.message?.toLowerCase().includes(q.toLowerCase()))) return false
          return true
        })
        total = filtered.length
        items = filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(skip, skip + limit)
      }

      return sendSuccess({
        items: items.map(({ _id, ...r }) => r),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    }

    if (route.startsWith('/admin/inquiries/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN', 'INQUIRY_MANAGER'])
      const id = route.split('/')[3]
      const { status } = await request.json()
      if (!['NEW', 'CONTACTED', 'IN_PROGRESS', 'CLOSED'].includes(status)) {
        return sendError('VALIDATION_ERROR', 'Invalid status tag.')
      }

      if (db) {
        await db.collection('inquiries').updateOne({ id }, { $set: { status } })
      } else {
        const localData = readBackupData('inquiries')
        const idx = localData.findIndex(i => i.id === id)
        if (idx !== -1) {
          localData[idx].status = status
          writeBackupData('inquiries', localData)
        }
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/inquiries/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN', 'INQUIRY_MANAGER'])
      const id = route.split('/')[3]

      if (db) {
        await db.collection('inquiries').deleteOne({ id })
      } else {
        const localData = readBackupData('inquiries')
        const filtered = localData.filter(i => i.id !== id)
        writeBackupData('inquiries', filtered)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: HERO SLIDES CRUD
    if (route === '/admin/hero' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      let items = []
      if (db) {
        items = await db.collection('heroSlides').find({}).sort({ order: 1, createdAt: 1 }).toArray()
      } else {
        items = readBackupData('heroSlides').sort((a, b) => (a.order || 0) - (b.order || 0))
      }
      return sendSuccess(items.map(({ _id, ...r }) => r))
    }

    if (route === '/admin/hero' && method === 'POST') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const body = await request.json()
      if (!body.title || !body.image) return sendError('VALIDATION_ERROR', 'Title and Image fields are required.')

      const doc = {
        id: uuidv4(),
        createdAt: new Date(),
        order: 999,
        active: true,
        ctaTarget: 'women',
        ...body
      }

      if (db) {
        await db.collection('heroSlides').insertOne(doc)
      } else {
        const localData = readBackupData('heroSlides')
        localData.push(doc)
        writeBackupData('heroSlides', localData)
      }
      return sendSuccess(doc, 201)
    }

    if (route.startsWith('/admin/hero/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]
      const body = await request.json()
      delete body._id; delete body.id

      if (db) {
        await db.collection('heroSlides').updateOne({ id }, { $set: body })
      } else {
        const localData = readBackupData('heroSlides')
        const idx = localData.findIndex(h => h.id === id)
        if (idx !== -1) {
          localData[idx] = { ...localData[idx], ...body }
          writeBackupData('heroSlides', localData)
        }
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/hero/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]

      if (db) {
        await db.collection('heroSlides').deleteOne({ id })
      } else {
        const localData = readBackupData('heroSlides')
        const filtered = localData.filter(h => h.id !== id)
        writeBackupData('heroSlides', filtered)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: DAILY ATELIER CRUD
    if (route === '/admin/gallery' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      let items = []
      if (db) {
        items = await db.collection('gallery').find({}).sort({ order: 1, createdAt: 1 }).toArray()
      } else {
        items = readBackupData('gallery').sort((a, b) => (a.order || 0) - (b.order || 0))
      }
      return sendSuccess(items.map(({ _id, ...r }) => r))
    }

    if (route === '/admin/gallery' && method === 'POST') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const body = await request.json()
      if (!body.image) return sendError('VALIDATION_ERROR', 'Image string is required.')

      const doc = {
        id: uuidv4(),
        createdAt: new Date(),
        order: 999,
        link: '',
        published: true,
        caption: '',
        alt: '',
        ...body
      }

      if (db) {
        await db.collection('gallery').insertOne(doc)
      } else {
        const localData = readBackupData('gallery')
        localData.push(doc)
        writeBackupData('gallery', localData)
      }
      return sendSuccess(doc, 201)
    }

    if (route.startsWith('/admin/gallery/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]
      const body = await request.json()
      delete body._id; delete body.id

      if (db) {
        await db.collection('gallery').updateOne({ id }, { $set: body })
      } else {
        const localData = readBackupData('gallery')
        const idx = localData.findIndex(g => g.id === id)
        if (idx !== -1) {
          localData[idx] = { ...localData[idx], ...body }
          writeBackupData('gallery', localData)
        }
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/gallery/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]

      if (db) {
        await db.collection('gallery').deleteOne({ id })
      } else {
        const localData = readBackupData('gallery')
        const filtered = localData.filter(g => g.id !== id)
        writeBackupData('gallery', filtered)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: BLOGS CRUD
    if (route === '/admin/blogs' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1', 10)
      const limit = parseInt(url.searchParams.get('limit') || '20', 10)
      const skip = (page - 1) * limit

      let items = []
      let total = 0

      if (db) {
        total = await db.collection('blogs').countDocuments()
        items = await db.collection('blogs').find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()
      } else {
        const localData = readBackupData('blogs')
        total = localData.length
        items = localData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(skip, skip + limit)
      }

      return sendSuccess({
        items: items.map(({ _id, ...r }) => r),
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      })
    }

    if (route === '/admin/blogs' && method === 'POST') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const body = await request.json()
      if (!body.title) return sendError('VALIDATION_ERROR', 'Blog title is required.')

      const slug = await generateUniqueSlug(db, 'blogs', body.title, body.slug)
      const doc = {
        id: uuidv4(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'draft',
        excerpt: '',
        content: '',
        cover: '',
        ...body,
        slug
      }

      if (db) {
        await db.collection('blogs').insertOne(doc)
      } else {
        const localData = readBackupData('blogs')
        localData.push(doc)
        writeBackupData('blogs', localData)
      }
      return sendSuccess(doc, 201)
    }

    if (route.startsWith('/admin/blogs/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]
      const body = await request.json()
      delete body._id; delete body.id
      body.updatedAt = new Date()

      if (db) {
        const existing = await db.collection('blogs').findOne({ id })
        if (!existing) return sendError('NOT_FOUND', 'Blog not found.', 404)
        if (body.title && body.title !== existing.title && !body.slug) {
          body.slug = await generateUniqueSlug(db, 'blogs', body.title)
        }
        await db.collection('blogs').updateOne({ id }, { $set: body })
      } else {
        const localData = readBackupData('blogs')
        const idx = localData.findIndex(b => b.id === id)
        if (idx === -1) return sendError('NOT_FOUND', 'Blog not found.', 404)
        localData[idx] = { ...localData[idx], ...body }
        writeBackupData('blogs', localData)
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/blogs/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN', 'CONTENT_MANAGER'])
      const id = route.split('/')[3]

      if (db) {
        await db.collection('blogs').deleteOne({ id })
      } else {
        const localData = readBackupData('blogs')
        const filtered = localData.filter(b => b.id !== id)
        writeBackupData('blogs', filtered)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: WEBSITE SETTINGS PUT
    if (route === '/admin/settings' && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN'])
      const body = await request.json()
      delete body._id; delete body.id

      if (db) {
        await db.collection('settings').updateOne({ id: 'main' }, { $set: body }, { upsert: true })
      } else {
        const localSettings = readBackupData('settings')
        const idx = localSettings.findIndex(item => item.id === 'main')
        if (idx !== -1) {
          localSettings[idx] = { ...localSettings[idx], ...body }
        } else {
          localSettings.push({ id: 'main', ...body })
        }
        writeBackupData('settings', localSettings)
      }
      return sendSuccess({ ok: true })
    }

    // ADMIN: MANAGE ADMIN USERS CRUD
    if (route === '/admin/users' && method === 'GET') {
      verifyAdmin(request, ['SUPER_ADMIN'])
      let admins = []
      if (db) {
        admins = await db.collection('admins').find({}).toArray()
      } else {
        admins = readBackupData('admins')
      }
      return sendSuccess(admins.map(({ _id, passwordHash, ...r }) => r))
    }

    if (route === '/admin/users' && method === 'POST') {
      verifyAdmin(request, ['SUPER_ADMIN'])
      const { email, password, role, name } = await request.json()
      if (!email || !password || !role || !name) {
        return sendError('VALIDATION_ERROR', 'Email, password, role, and name are required.')
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) return sendError('VALIDATION_ERROR', 'Invalid email format.')

      if (password.length < 6) return sendError('VALIDATION_ERROR', 'Password must be at least 6 characters long.')

      if (!['SUPER_ADMIN', 'CONTENT_MANAGER', 'INQUIRY_MANAGER'].includes(role)) {
        return sendError('VALIDATION_ERROR', 'Invalid role selection.')
      }

      const doc = {
        id: uuidv4(),
        email: email.toLowerCase(),
        passwordHash: bcrypt.hashSync(password, 10),
        role,
        name,
        createdAt: new Date()
      }

      if (db) {
        const exists = await db.collection('admins').findOne({ email: email.toLowerCase() })
        if (exists) return sendError('CONFLICT', 'Admin user already exists.', 409)
        await db.collection('admins').insertOne(doc)
      } else {
        const localData = readBackupData('admins')
        const exists = localData.some(a => a.email === email.toLowerCase())
        if (exists) return sendError('CONFLICT', 'Admin user already exists.', 409)
        localData.push(doc)
        writeBackupData('admins', localData)
      }

      const { passwordHash, ...rest } = doc
      return sendSuccess(rest, 201)
    }

    if (route.startsWith('/admin/users/') && method === 'PUT') {
      verifyAdmin(request, ['SUPER_ADMIN'])
      const id = route.split('/')[3]
      const body = await request.json()
      delete body._id; delete body.id; delete body.email

      if (body.password) {
        body.passwordHash = bcrypt.hashSync(body.password, 10)
        delete body.password
      }

      if (db) {
        await db.collection('admins').updateOne({ id }, { $set: body })
      } else {
        const localData = readBackupData('admins')
        const idx = localData.findIndex(a => a.id === id)
        if (idx !== -1) {
          localData[idx] = { ...localData[idx], ...body }
          writeBackupData('admins', localData)
        }
      }
      return sendSuccess({ ok: true })
    }

    if (route.startsWith('/admin/users/') && method === 'DELETE') {
      verifyAdmin(request, ['SUPER_ADMIN'])
      const id = route.split('/')[3]

      // Prevent self-deletion
      const caller = verifyAdmin(request)
      if (caller.id === id) return sendError('BAD_REQUEST', 'You cannot delete your own admin account.')

      if (db) {
        await db.collection('admins').deleteOne({ id })
      } else {
        const localData = readBackupData('admins')
        const filtered = localData.filter(a => a.id !== id)
        writeBackupData('admins', filtered)
      }
      return sendSuccess({ ok: true })
    }

    return sendError('NOT_FOUND', `Route ${route} not found`, 404)
  } catch (error) {
    if (error.message === 'UNAUTHORIZED') return sendError('UNAUTHORIZED', 'Missing or invalid token.', 401)
    if (error.message === 'FORBIDDEN') return sendError('FORBIDDEN', 'Access denied for this role.', 403)
    console.error('API Error handler:', error)
    return sendError('INTERNAL_SERVER_ERROR', 'An internal server error occurred.', 500)
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute

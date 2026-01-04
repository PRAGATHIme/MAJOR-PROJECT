# 🚀 Setup Steps - Follow These Exactly

## Step 1: Install Dependencies (30 seconds)

Open Command Prompt in the `backend` folder and run:

```cmd
npm install
```

Wait for it to complete. You should see "added X packages".

---

## Step 2: Find Your MySQL Password (30 seconds)

Run this command:

```cmd
npm run test:mysql
```

This will automatically test common passwords and tell you which one works!

**Example output:**
```
🔍 Testing common passwords...
   Trying "(empty)"... ❌ Failed
   Trying "root"... ✅ SUCCESS!

Your MySQL root password is: root

Update your .env file:
DB_PASSWORD=root
```

---

## Step 3: Update .env File (10 seconds)

Open `backend/.env` in a text editor and update the password:

```env
DB_PASSWORD=root
```

(Use the password from Step 2)

---

## Step 4: Setup Database (1 minute)

Run this command:

```cmd
npm run setup:db
```

When prompted, enter your MySQL password (the one from Step 2).

This will:
- ✅ Create the database
- ✅ Import the schema (6 tables)
- ✅ Verify everything is set up

**Example output:**
```
📡 Connecting to MySQL...
✅ Connected!

📊 Creating database...
✅ Database "ecommerce_db" created!

⚙️  Importing schema...
✅ Schema imported!

✅ Tables created:
   ✓ users
   ✓ products
   ✓ orders
   ✓ order_items
   ✓ cart_items
   ✓ forensic_logs
```

---

## Step 5: Start the Server (10 seconds)

```cmd
npm run start:mysql
```

You should see:

```
✅ MySQL Database Connected
🚀 Server running on port 4000
📊 Forensic logging enabled
```

---

## Step 6: Test Everything (30 seconds)

Open a **new** Command Prompt window and run:

```cmd
cd backend
npm test
```

You should see:

```
🧪 Test 1: Server Status ✅
🧪 Test 2: User Signup ✅
🧪 Test 3: User Login ✅
...
🎉 All tests passed!
```

---

## ✅ Success Checklist

```
□ npm install completed
□ npm run test:mysql found password
□ Updated .env with password
□ npm run setup:db completed
□ npm run start:mysql shows "MySQL Database Connected"
□ npm test shows "All tests passed"
```

---

## 🚨 Troubleshooting

### Problem: "mysql2 not installed"
**Solution:** Run `npm install` first

### Problem: "Access denied"
**Solution:** 
1. Run `npm run test:mysql` to find password
2. Update `.env` with correct password
3. Try again

### Problem: "MySQL not running"
**Solution:** 
```cmd
net start MySQL80
```

### Problem: "Cannot find module"
**Solution:** Make sure you're in the `backend` folder:
```cmd
cd backend
npm install
```

### Problem: "Schema file not found"
**Solution:** Make sure you're running commands from the `backend` folder

---

## 📞 Need More Help?

- **Quick fixes:** `QUICK_FIX.md`
- **MySQL setup:** `MYSQL_SETUP.md`
- **Detailed guide:** `SETUP_GUIDE.md`
- **Start here:** `START_HERE.md`

---

## 🎯 Quick Commands Summary

```cmd
# 1. Install
npm install

# 2. Find password
npm run test:mysql

# 3. Setup database
npm run setup:db

# 4. Start server
npm run start:mysql

# 5. Test
npm test
```

---

## ✨ That's It!

Once all steps are complete, your MySQL e-commerce backend with forensic logging is ready!

Check out:
- `README.md` - Full documentation
- `FORENSIC_LOGGING.md` - Logging features
- `ARCHITECTURE.md` - System design

**Happy coding! 🚀**

# 🎉 Gmail MCP Client - Working Successfully!

Your Gmail MCP client is now fully functional! Here's how to use it:

## ✅ **What's Working:**

- ✅ **Gmail Labels** - Fetch all your Gmail labels
- ✅ **List Emails** - Get emails from any label (INBOX, SENT, etc.)
- ✅ **Search Emails** - Use Gmail search queries
- ✅ **Read Emails** - Read specific email content
- ✅ **Send Emails** - Send emails via Gmail
- ✅ **Beautiful UI** - Rich tables and panels

## 🚀 **Quick Commands:**

### **1. Get All Labels**

```bash
python gmail_cli.py labels
```

### **2. List Recent Emails**

```bash
# List 10 emails from INBOX
python gmail_cli.py list-emails

# List 5 emails from SENT folder
python gmail_cli.py list-emails --max-results 5 --label SENT

# List emails from custom labels
python gmail_cli.py list-emails --max-results 5 --label "IT company"
python gmail_cli.py list-emails --max-results 5 --label TEJ
```

### **3. Search Emails**

```bash
# Basic searches
python gmail_cli.py search "is:unread"
python gmail_cli.py search "is:important"
python gmail_cli.py search "from:google.com" --max-results 5

# Advanced searches
python gmail_cli.py search "subject:meeting" --max-results 3
python gmail_cli.py search "has:attachment" --max-results 5
python gmail_cli.py search "newer_than:1w" --max-results 10
python gmail_cli.py search "larger:5M" --max-results 3
python gmail_cli.py search "category:promotions" --max-results 5

# Combined searches
python gmail_cli.py search "is:unread from:amazon.com" --max-results 3
python gmail_cli.py search "is:important after:2024/01/01" --max-results 5
python gmail_cli.py search "subject:urgent has:attachment" --max-results 2
```

### **4. Read Specific Email**

```bash
python gmail_cli.py read 198a85adea90de47
```

### **5. Send Email**

```bash
python gmail_cli.py send
# Will prompt for: to, subject, body
```

### **6. Run Full Demo**

```bash
python gmail_cli.py demo
```

### **7. Interactive Mode**

```bash
python gmail_cli.py interactive
```

## 🔍 **Gmail Search Examples:**

### **Basic Search Operators:**
- `is:unread` - Unread emails
- `is:read` - Read emails
- `is:important` - Important emails
- `is:starred` - Starred emails
- `is:snoozed` - Snoozed emails
- `is:sent` - Sent emails
- `is:draft` - Draft emails
- `is:spam` - Spam emails
- `is:trash` - Trash emails

### **Sender/Recipient Search:**
- `from:google.com` - Emails from Google domain
- `from:john@example.com` - Emails from specific address
- `to:me@gmail.com` - Emails sent to specific address
- `cc:team@company.com` - Emails CC'd to specific address
- `bcc:admin@company.com` - Emails BCC'd to specific address

### **Subject and Content Search:**
- `subject:"meeting"` - Emails with "meeting" in subject
- `subject:urgent` - Emails with "urgent" in subject
- `has:attachment` - Emails with attachments
- `filename:pdf` - Emails with PDF attachments
- `filename:presentation` - Emails with files containing "presentation"

### **Date and Time Search:**
- `after:2024/01/01` - Emails after January 1, 2024
- `before:2024/12/31` - Emails before December 31, 2024
- `newer_than:1d` - Emails newer than 1 day
- `newer_than:1w` - Emails newer than 1 week
- `newer_than:1m` - Emails newer than 1 month
- `older_than:1y` - Emails older than 1 year

### **Size and Label Search:**
- `larger:10M` - Emails larger than 10MB
- `smaller:1M` - Emails smaller than 1MB
- `label:work` - Emails with "work" label
- `label:important` - Emails with "important" label
- `has:userlabels` - Emails with custom labels

### **Advanced Search Operators:**
- `deliveredto:me@gmail.com` - Emails delivered to specific address
- `category:primary` - Primary category emails
- `category:social` - Social category emails
- `category:promotions` - Promotions category emails
- `category:updates` - Updates category emails
- `category:forums` - Forums category emails

### **Combined Search Examples:**
- `is:unread from:google.com` - Unread emails from Google
- `is:important after:2024/01/01` - Important emails after Jan 1, 2024
- `subject:"meeting" has:attachment` - Meeting emails with attachments
- `from:boss@company.com is:unread` - Unread emails from your boss
- `larger:5M has:attachment` - Large emails with attachments
- `label:work is:important` - Important work emails
- `newer_than:1w is:unread` - Unread emails from last week
- `from:amazon.com category:promotions` - Amazon promotional emails

## 📁 **Available Labels:**

**System Labels:**

- `INBOX` - Main inbox
- `SENT` - Sent emails
- `DRAFT` - Draft emails
- `SPAM` - Spam folder
- `TRASH` - Trash folder
- `IMPORTANT` - Important emails
- `STARRED` - Starred emails

**Your Custom Labels:**

- `IT company`, `NMB`, `LinkedIn`, `Quora`, `TEJ`, `eSewa`, etc.

## 🎯 **Interactive Mode Commands:**

When in interactive mode (`python gmail_cli.py interactive`):

### **Basic Commands:**
```
gmail> labels                    # Get all labels
gmail> list 5                   # List 5 emails from INBOX
gmail> list 10 SENT             # List 10 emails from SENT
gmail> search "is:unread" 5     # Search for 5 unread emails
gmail> search "from:google.com" # Search emails from Google
gmail> read 198a85adea90de47    # Read specific email
gmail> send user@example.com "Test" "Hello world"  # Send email
gmail> help                     # Show available commands
gmail> quit                     # Exit
```

### **Advanced Search Examples:**
```
gmail> search "is:important" 10           # Important emails
gmail> search "subject:meeting" 5         # Meeting emails
gmail> search "has:attachment" 3          # Emails with attachments
gmail> search "newer_than:1w" 10          # Emails from last week
gmail> search "from:amazon.com" 5         # Amazon emails
gmail> search "larger:5M" 3               # Large emails
gmail> search "label:work" 10             # Work label emails
gmail> search "category:promotions" 5     # Promotional emails
gmail> search "is:unread from:boss" 5     # Unread emails from boss
gmail> search "after:2024/01/01" 10       # Emails after date
```

### **Label-Specific Examples:**
```
gmail> list 5 INBOX              # INBOX emails
gmail> list 10 SENT              # Sent emails
gmail> list 5 DRAFT              # Draft emails
gmail> list 5 SPAM               # Spam emails
gmail> list 5 TRASH              # Trash emails
gmail> list 5 IMPORTANT          # Important emails
gmail> list 5 STARRED            # Starred emails
gmail> list 5 "IT company"       # Custom label emails
gmail> list 5 TEJ                # TEJ project emails
gmail> list 5 LinkedIn           # LinkedIn emails
```

### **Email Reading Examples:**
```
gmail> read 198a85adea90de47     # Read by ID
gmail> read 18c1234567890abcdef  # Read another email
```

### **Email Sending Examples:**
```
gmail> send john@example.com "Meeting Tomorrow" "Hi John, let's meet tomorrow at 2 PM"
gmail> send team@company.com "Weekly Update" "Here's this week's progress report"
gmail> send boss@company.com "Project Complete" "The project has been completed successfully"
```

## 💼 **Practical Use Cases:**

### **Daily Email Management:**
```bash
# Check unread emails first thing in the morning
python gmail_cli.py search "is:unread" --max-results 10

# Find important emails from today
python gmail_cli.py search "is:important newer_than:1d" --max-results 5

# Check emails from your boss
python gmail_cli.py search "from:boss@company.com" --max-results 5
```

### **Project-Specific Email Management:**
```bash
# Check TEJ project emails
python gmail_cli.py list-emails --label TEJ --max-results 10

# Find emails with attachments for a project
python gmail_cli.py search "subject:TEJ has:attachment" --max-results 5

# Search for meeting-related emails
python gmail_cli.py search "subject:meeting OR subject:call" --max-results 10
```

### **Email Cleanup and Organization:**
```bash
# Find large emails that might need cleanup
python gmail_cli.py search "larger:10M" --max-results 10

# Check promotional emails
python gmail_cli.py search "category:promotions" --max-results 5

# Find old emails that might be archived
python gmail_cli.py search "older_than:1y" --max-results 10
```

### **Quick Communication:**
```bash
# Send a quick status update
python gmail_cli.py send

# Send meeting confirmation
python gmail_cli.py send

# Send project completion notification
python gmail_cli.py send
```

### **Automated Email Monitoring:**
```bash
# Check for urgent emails
python gmail_cli.py search "subject:urgent OR subject:emergency" --max-results 5

# Monitor emails from specific domains
python gmail_cli.py search "from:github.com OR from:gitlab.com" --max-results 5

# Check for system notifications
python gmail_cli.py search "from:noreply OR from:notifications" --max-results 5
```

## 🎯 **Pro Tips:**

### **1. Use Interactive Mode for Complex Workflows:**
```bash
python gmail_cli.py interactive
# Then use multiple commands in sequence
```

### **2. Combine with Shell Scripts:**
```bash
#!/bin/bash
# daily_email_check.sh
echo "=== Daily Email Check ==="
python gmail_cli.py search "is:unread" --max-results 5
python gmail_cli.py search "is:important" --max-results 3
python gmail_cli.py search "from:boss@company.com" --max-results 2
```

### **3. Create Aliases for Common Commands:**
```bash
# Add to your .bashrc or .zshrc
alias gmail-unread='python gmail_cli.py search "is:unread" --max-results 10'
alias gmail-important='python gmail_cli.py search "is:important" --max-results 5'
alias gmail-tej='python gmail_cli.py list-emails --label TEJ --max-results 10'
alias gmail-send='python gmail_cli.py send'
```

### **4. Use with Cron Jobs:**
```bash
# Check for urgent emails every hour
0 * * * * cd /path/to/mcp-client && python gmail_cli.py search "subject:urgent" --max-results 3
```

## 🏆 **Success!**

Your Gmail MCP client is now ready for daily use! You can:

- Check your emails quickly
- Search through your inbox efficiently
- Send emails from the command line
- Manage your Gmail labels
- Automate email workflows
- Create custom email monitoring scripts

Enjoy your new Gmail productivity tool! 🚀

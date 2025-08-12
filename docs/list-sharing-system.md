# List Sharing System

The Lyst Backend includes a simple and effective list sharing system that generates public sharing links. Users can copy these links and share them via any channel they prefer (WhatsApp, SMS, email, social media, etc.). The system automatically handles both registered and unregistered users, creating invitations when needed.

## 🚀 Features

### Core Functionality
- **Link-Based Sharing**: Generate public sharing links for lists
- **Universal Compatibility**: Share links via any channel (WhatsApp, SMS, email, social media, etc.)
- **Smart User Detection**: Automatically detects if recipients are registered users
- **Automatic Invitations**: Creates user invitations for unregistered recipients
- **Share Management**: Track, accept, and revoke list shares
- **Real-time Status**: Monitor sharing status and acceptance

### User Experience
- **Seamless Integration**: Works with existing authentication system
- **Automatic Notifications**: Sends appropriate messages based on sharing method
- **Invitation Tracking**: Users can see pending and accepted invitations
- **Share History**: Track all shared lists and their current status

## 🏗️ Architecture

### Database Schemas

#### SharedList Schema
```typescript
{
  listId: ObjectId,           // Reference to the shared list
  ownerId: string,            // User who owns the list
  sharedWithId: string,       // User ID or invitation token
  sharedWithContact: string,  // Optional: filled when user accepts
  status: ShareStatus,        // PENDING, ACCEPTED, DECLINED, EXPIRED
  invitationToken: string,    // For unregistered users
  invitationExpiry: Date,     // When invitation expires
  isActive: boolean,          // Whether sharing is active
  message: string,            // Custom message from owner
  timestamps: true            // Created/updated timestamps
}
```

#### UserInvitation Schema
```typescript
{
  invitationToken: string,    // Unique invitation identifier
  contact: string,            // Phone number or email
  contactType: string,        // PHONE or EMAIL
  invitedBy: string,          // User ID who sent invitation
  status: InvitationStatus,   // PENDING, ACCEPTED, EXPIRED, CANCELLED
  expiresAt: Date,            // Invitation expiration
  userId: string,             // User ID after registration
  message: string,            // Custom invitation message
  timestamps: true            // Created/updated timestamps
}
```

### Service Layer

#### SharingService
- **shareList()**: Main method for sharing lists
- **acceptShare()**: Handle share acceptance
- **getSharedLists()**: Get lists shared with user
- **getMySharedLists()**: Get lists shared by user
- **revokeShare()**: Revoke list access

#### SharingService
- **shareList()**: Generate sharing link for a list
- **acceptShare()**: Handle share acceptance
- **getSharedLists()**: Get lists shared with user
- **getMySharedLists()**: Get lists shared by user
- **revokeShare()**: Revoke list access

## 🔌 API Endpoints

### Share a List
```http
POST /sharing/share
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "listId": "507f1f77bcf86cd799439011",
  "message": "Check out this grocery list!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "List shared successfully",
  "shareId": "507f1f77bcf86cd799439012",
  "invitationToken": "abc123def456",
  "sharingLink": "https://your-app.com/shared/abc123def456",
  "shareMessageTemplate": "Check out this list: https://your-app.com/shared/abc123def456"
}
```

### Accept a Share
```http
POST /sharing/accept
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "invitationToken": "abc123def456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "List shared successfully",
  "listId": "507f1f77bcf86cd799439011"
}
```

### Get Shared Lists
```http
GET /sharing/received
Authorization: Bearer <firebase-token>
```

### Get My Shared Lists
```http
GET /sharing/sent
Authorization: Bearer <firebase-token>
```

### Revoke a Share
```http
DELETE /sharing/:shareId
Authorization: Bearer <firebase-token>
```

## 🔄 Sharing Flow

### 1. List Sharing Process
```
User A → Create Share Link → Generate Public URL
                    ↓
              Copy & Paste Link → Share via Any Channel
                    ↓
              Recipient Clicks Link → Check Registration Status
                    ↓
              Registered User? → Yes → Direct Access
                    ↓ No
              Show Registration → Accept Invitation
```

### 2. Link-Based Sharing
1. User creates a sharing link for their list
2. System generates a unique invitation token
3. User copies the sharing link or message template
4. User shares the link via their preferred channel (WhatsApp, SMS, email, etc.)
5. Recipient clicks the link and can either:
   - View the list immediately (if registered)
   - Register to view the list (if not registered)

### 3. Benefits of Link-Based Approach
- **Universal Compatibility**: Works with any messaging platform
- **No External Dependencies**: No need for WhatsApp Business API, Twilio, etc.
- **User Control**: Users choose how and where to share
- **Simpler Implementation**: No complex notification service needed
- **Better UX**: Users can customize messages for different platforms

### 2. For Registered Users
1. User clicks sharing link
2. System verifies user authentication
3. User can immediately access the shared list
4. Share status updated to `ACCEPTED`

### 3. For Unregistered Users
1. User clicks sharing link
2. System shows invitation to register
3. User registers using invitation token
4. Share automatically accepted and linked to new user

## 🔧 Integration Guide

### Frontend Integration

The sharing system is designed to work with any frontend framework. Here's how to integrate it:

#### 1. Create Share Button
```typescript
const ShareButton = ({ listId, listName }) => {
  const [shareData, setShareData] = useState(null);

  const handleShare = async () => {
    const response = await fetch('/sharing/share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firebaseToken}`,
      },
      body: JSON.stringify({ listId, message: `Check out ${listName}!` }),
    });

    const result = await response.json();
    if (result.success) {
      setShareData(result);
    }
  };

  return (
    <div>
      <button onClick={handleShare}>Share List</button>
      {shareData && <ShareResults data={shareData} />}
    </div>
  );
};
```

#### 2. Display Share Results
```typescript
const ShareResults = ({ data }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Show success message
  };

  return (
    <div>
      <h3>Share this list:</h3>
      
      <div>
        <label>Direct Link:</label>
        <input value={data.sharingLink} readOnly />
        <button onClick={() => copyToClipboard(data.sharingLink)}>
          Copy Link
        </button>
      </div>
      
      <div>
        <label>Ready Message:</label>
        <textarea value={data.shareMessageTemplate} readOnly />
        <button onClick={() => copyToClipboard(data.shareMessageTemplate)}>
          Copy Message
        </button>
      </div>
    </div>
  );
};
```

### Environment Variables

Only one environment variable is needed:

```env
# Frontend URL for sharing links
FRONTEND_URL=https://your-app.com
```

### No External Services Required

Unlike the old system, this approach requires:
- ✅ No WhatsApp Business API setup
- ✅ No Twilio SMS account
- ✅ No SendGrid email service
- ✅ No external API monitoring
- ✅ No rate limit management

## 📱 Frontend Integration

### Share Button Component
```typescript
const ShareListButton = ({ listId, listName }) => {
  const [shareMethod, setShareMethod] = useState('WHATSAPP');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');

  const handleShare = async () => {
    try {
      const response = await fetch('/sharing/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          listId,
          contact,
          shareMethod,
          message: message || `Check out this list: ${listName}`,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        if (result.requiresRegistration) {
          // Show invitation sent message
          showNotification('Invitation sent! Recipient will receive a registration link.');
        } else {
          // Show direct share message
          showNotification('List shared successfully!');
        }
      }
    } catch (error) {
      showError('Failed to share list');
    }
  };

  return (
    <div>
      <select value={shareMethod} onChange={(e) => setShareMethod(e.target.value)}>
        <option value="WHATSAPP">WhatsApp</option>
        <option value="SMS">SMS</option>
        <option value="EMAIL">Email</option>
      </select>
      
      <input
        type="text"
        placeholder="Phone number or email"
        value={contact}
        onChange={(e) => setContact(e.target.value)}
      />
      
      <textarea
        placeholder="Optional message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      
      <button onClick={handleShare}>Share List</button>
    </div>
  );
};
```

### Invitation Acceptance
```typescript
const InvitationAcceptance = ({ invitationToken }) => {
  const handleAccept = async () => {
    try {
      const response = await fetch('/sharing/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({ invitationToken }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Redirect to shared list
        router.push(`/lists/${result.listId}`);
      }
    } catch (error) {
      showError('Failed to accept invitation');
    }
  };

  return (
    <div>
      <h2>You've been invited to view a shared list!</h2>
      <button onClick={handleAccept}>Accept Invitation</button>
    </div>
  );
};
```

## 🧪 Testing

### Unit Tests
```typescript
describe('SharingService', () => {
  it('should share list with registered user', async () => {
    // Test implementation
  });

  it('should create invitation for unregistered user', async () => {
    // Test implementation
  });

  it('should accept share invitation', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```typescript
describe('SharingController', () => {
  it('should share list via POST /sharing/share', async () => {
    // Test implementation
  });

  it('should accept share via POST /sharing/accept', async () => {
    // Test implementation
  });
});
```

## 🔒 Security Considerations

### Authentication
- All sharing endpoints require Firebase authentication
- Users can only share their own lists
- Users can only revoke their own shares

### Validation
- Contact information validation (phone/email format)
- List ownership verification
- Invitation token validation and expiration

### Rate Limiting
- Implement rate limiting for sharing operations
- Prevent spam invitations
- Monitor sharing patterns

## 🚀 Deployment

### Environment Variables
```env
# Frontend URL for invitation links
FRONTEND_URL=https://your-app.com

# WhatsApp Business API
WHATSAPP_API_KEY=your_api_key
WHATSAPP_API_SECRET=your_api_secret
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_number

# SendGrid Email
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=your_verified_email
```

### Dependencies
```json
{
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

## 🔄 Future Enhancements

### Planned Features
- **Group Sharing**: Share lists with multiple users at once
- **Share Permissions**: Read-only vs. edit permissions
- **Share Analytics**: Track sharing engagement and acceptance rates
- **Bulk Operations**: Share multiple lists simultaneously
- **Share Templates**: Predefined sharing messages and formats

### Integration Opportunities
- **Slack Integration**: Share lists to Slack channels
- **Microsoft Teams**: Share lists to Teams
- **Discord**: Share lists to Discord servers
- **Telegram**: Share lists via Telegram bot

## 📚 Additional Resources

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Twilio SMS API Documentation](https://www.twilio.com/docs/sms)
- [SendGrid Email API Documentation](https://sendgrid.com/docs/api-reference/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/) 
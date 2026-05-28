# Aadhaar-Zero: Privacy-Preserving Digital Identity with Zero-Knowledge Proofs

A cutting-edge frontend application for privacy-preserving KYC (Know Your Customer) using zero-knowledge proofs, enabling secure credential issuance and verification without exposing personal data.

## Features

- **Zero-Knowledge Proof Integration**: Share only the information verifiers need, nothing more
- **Multi-Modal Enrollment**: 4-step wizard with personal info, document upload, liveness detection, and consent
- **Secure Credential Wallet**: Manage multiple digital credentials (Aadhaar, PAN, License, Passport)
- **QR Code Verification**: Generate and scan QR codes for instant credential verification
- **Blockchain Audit Trail**: All transactions stored on blockchain for immutability
- **Privacy-First Architecture**: Credentials verified without revealing underlying data
- **Responsive Design**: Fully optimized for mobile and desktop devices
- **Smooth Animations**: Framer Motion animations for delightful UX

## Demo Credentials

**Email**: `demo@aadhaar-zero.com`  
**Password**: `demo123`

## Tech Stack

- **Frontend Framework**: Next.js 16 with React 19
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: React Context API
- **Animations**: Framer Motion
- **QR Code**: qrcode.react
- **Camera**: react-webcam
- **Notifications**: Sonner
- **TypeScript**: For type safety
- **API Client**: Custom mock API layer with real integration ready

## Project Structure

```
app/
├── landing/              # Landing page with hero and features
├── login/               # Login page
├── register/            # Registration page
├── enroll/              # Enrollment wizard (4 steps)
│   ├── step1/          # Personal information
│   ├── step2/          # Document upload
│   ├── step3/          # Liveness verification
│   └── step4/          # Consent & issuance
├── dashboard/          # Main dashboard with credential wallet
├── credentials/[id]/   # Credential detail views
│   ├── page.tsx       # View credential details
│   └── share/         # Generate and share ZK proofs
├── verify/            # Verifier portal for proof validation
└── layout.tsx         # Root layout with providers

components/
├── Navbar.tsx         # Top navigation
├── CredentialCard.tsx # Reusable credential card
├── ActivityTimeline.tsx # Activity history timeline
└── ui/               # shadcn/ui components

contexts/
├── AuthContext.tsx    # Authentication state
└── EnrollmentContext.tsx # Enrollment wizard state

lib/
├── types.ts          # TypeScript interfaces
├── api-client.ts     # Mock API with real integration ready
└── mocks.ts          # Demo data
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (or npm/yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/aadhaar-zero.git
cd aadhaar-zero

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Key Pages

### Landing Page (`/landing`)
- Hero section with value proposition
- Feature cards explaining capabilities
- How it works section
- Call-to-action buttons
- Professional footer

### Authentication
- **Login** (`/login`): Demo credentials pre-filled for quick access
- **Register** (`/register`): 2-step registration with name then email/password

### Enrollment Wizard (`/enroll`)
1. **Step 1 - Personal Info**: Collect name, DOB, email, phone
2. **Step 2 - Document Upload**: Upload ID document with auto-extraction
3. **Step 3 - Liveness Check**: Multi-modal liveness detection with camera option
4. **Step 4 - Consent**: Accept terms before credential issuance

### Dashboard (`/dashboard`)
- Statistics cards (credentials, verifications, privacy score)
- Credential grid with quick actions
- Recent activity timeline
- "Add New Credential" button

### Credential Details (`/credentials/[id]`)
- Full credential information
- Blockchain transaction details
- Copyable proof hashes
- Share and revoke options

### Share & Generate Proof (`/credentials/[id]/share`)
- Generate zero-knowledge proof
- Display QR code for scanning
- Copy proof token
- Download QR code

### Verification Portal (`/verify`)
- Paste or scan proof tokens
- Organization name input
- Real-time verification feedback
- Privacy information display

## API Client

The app uses a custom API client (`lib/api-client.ts`) with mock data by default. To switch to real backend:

1. Set `DEMO_MODE = false` in `lib/api-client.ts`
2. Update `API_BASE_URL` environment variable
3. Implement corresponding backend endpoints

### Available API Endpoints

**Auth**
- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/logout`

**Enrollment**
- `POST /api/enrollment/upload-document`
- `POST /api/enrollment/extract-data`
- `POST /api/enrollment/verify-liveness`
- `POST /api/enrollment/issue-credential`

**Credentials**
- `GET /api/credentials`
- `GET /api/credentials/:id`
- `POST /api/credentials/:id/generate-proof`
- `DELETE /api/credentials/:id/revoke`

**Verification**
- `POST /api/verify/initiate`
- `GET /api/verify/:requestId`
- `POST /api/verify/:requestId/submit-proof`
- `GET /api/verify/history`

## Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_BLOCKCHAIN_EXPLORER_URL=https://etherscan.io
NEXT_PUBLIC_DEMO_MODE=true
```

## Demo Flow

1. Visit the landing page
2. Click "Get Started"
3. Register or use demo credentials (demo@aadhaar-zero.com / demo123)
4. Go through enrollment wizard (4 steps, ~5 minutes)
5. View credentials in dashboard
6. Click "Share" to generate QR code and proof
7. Visit `/verify` as a verifier to validate proofs

## Features Implemented

### Core MVP (Completed)
- [x] Beautiful landing page with feature overview
- [x] Authentication system (login/register)
- [x] 4-step enrollment wizard with all components
- [x] Credential wallet in dashboard
- [x] Credential detail views
- [x] Zero-knowledge proof generation with QR codes
- [x] Verifier portal for proof validation
- [x] Activity timeline and statistics
- [x] Responsive mobile design
- [x] Smooth animations and transitions
- [x] Mock data and demo mode
- [x] TypeScript throughout
- [x] Context-based state management

### Future Enhancements
- Backend integration with real APIs
- Actual blockchain deployment
- Advanced AI-powered liveness detection
- Multi-language support
- Dark mode refinements
- End-to-end encryption
- Audit logging
- Admin dashboard
- Rate limiting and security headers

## Performance Optimizations

- Route-based code splitting (automatic with Next.js)
- Image optimization with next/image
- Lazy-loaded components
- Memoized expensive components
- Mock API simulates realistic delays for demo

## Browser Support

- Chrome/Brave 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Deployment

### Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys on push
# Or manually deploy:
vercel
```

### Docker

```bash
docker build -t aadhaar-zero .
docker run -p 3000:3000 aadhaar-zero
```

## Security Considerations

- Input validation on all forms
- XSS protection with React
- CSRF tokens in forms (ready for backend)
- Sensitive data never logged to console
- Auto-logout on inactivity (15 minutes)
- httpOnly cookies ready for JWT tokens
- Content Security Policy recommended for production

## Testing

Manual testing checklist:
- [ ] Landing page loads and renders correctly
- [ ] Registration and login flow works
- [ ] All enrollment steps complete
- [ ] Credentials display in wallet
- [ ] QR code generates and displays
- [ ] Verification flow works end-to-end
- [ ] Mobile responsive on all breakpoints
- [ ] No console errors
- [ ] Animations smooth
- [ ] Loading states visible
- [ ] Error messages clear

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create a new issue with reproduction steps
3. Contact: support@aadhaar-zero.com

## Acknowledgments

- Built with Next.js and modern React patterns
- UI components from shadcn/ui and Radix UI
- Icons from Lucide React
- Animations powered by Framer Motion
- Inspiration from privacy-first identity solutions

---

**Built with passion for privacy and identity sovereignty.**

Version: 1.0.0  
Last Updated: 2/17/2026

# BountyBoard Frontend

React + TypeScript + Vite frontend for the BountyBoard decentralized task marketplace on Algorand TestNet.

## Features

- 🎨 Modern, responsive UI with TailwindCSS
- 🔗 Lute Wallet integration via WalletConnect
- 📋 Browse and filter tasks
- ✨ Create new tasks with escrow
- 🎯 Claim tasks as a freelancer
- 📤 Submit work with proof
- ✅ Approve/reject submissions
- 💰 Automatic payment release
- 📊 Personal dashboard
- 🔄 Real-time task status updates

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:5173

### Build for Production

```bash
npm run build
```

## Contract Integration

The frontend is connected to the deployed BountyBoard contract:

- **App ID:** 755782380
- **Network:** Algorand TestNet
- **Contract Address:** 6EZRERYLBPXSN44CU7ZHS4AG743ASLUYHJAJ57UXKJTSE4AIFJNJNYIUMM

Contract details are in `src/contract.json`.

## Wallet Connection

This app uses **@txnlab/use-wallet** which supports:

- **WalletConnect** (for Lute Wallet) ✅
- Defly Wallet
- Exodus Wallet
- Pera Wallet

To connect Lute Wallet:
1. Click "Connect Wallet"
2. Select "WalletConnect"
3. Scan QR code with Lute Wallet

## Pages

- **`/`** - Task Board (browse all tasks)
- **`/create`** - Create New Task
- **`/tasks/:id`** - Task Details & Actions
- **`/dashboard`** - User Dashboard

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development
- **TailwindCSS** for styling
- **React Router** for navigation
- **algosdk** for Algorand integration
- **@txnlab/use-wallet** for wallet management
- **react-hot-toast** for notifications
- **date-fns** for date formatting

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # Navigation & wallet connection
│   └── TaskCard.tsx        # Task display card
├── pages/
│   ├── TaskBoard.tsx       # Main task listing
│   ├── CreateTask.tsx      # Task creation form
│   ├── TaskDetails.tsx     # Task details & actions
│   └── Dashboard.tsx       # User dashboard
├── contract.json           # Deployed contract info
├── contract-abi.json       # Contract ABI
├── frontend-integration.ts # Contract interaction helpers
├── WalletProvider.tsx      # Wallet context
├── App.tsx                 # Main app & routing
└── main.tsx               # Entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment

The app is configured for **Algorand TestNet**:

- Algod API: `https://testnet-api.algonode.cloud`
- Network: TestNet
- No API keys required (public node)

## Development

### Adding New Features

1. Contract interactions: Extend `frontend-integration.ts`
2. New pages: Add to `pages/` and update `App.tsx` routes
3. Reusable UI: Add to `components/`

### Styling

Uses TailwindCSS with custom utilities in `index.css`:

- `btn-primary` - Primary action button
- `btn-secondary` - Secondary button
- `btn-success` - Success button
- `btn-danger` - Danger button
- `card` - Card container
- `input` - Form input
- `label` - Form label

## Troubleshooting

### Wallet Connection Issues

- Make sure you're using WalletConnect option for Lute Wallet
- Check that Lute Wallet is on TestNet
- Try disconnecting and reconnecting

### Transaction Failures

- Ensure sufficient ALGO balance (tasks + fees)
- Check task status before actions
- Verify you're the correct party (client/freelancer)

### Task Not Loading

- Refresh the page
- Check browser console for errors
- Verify task ID exists on contract

## License

MIT

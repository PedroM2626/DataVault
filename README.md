# DataVault

A modern full-stack application built with React, TypeScript, Express, and Tailwind CSS. This project provides a robust foundation for building data visualization and management applications.

## 🚀 Features

- **Frontend**: Built with React 18, TypeScript, and Vite
- **Styling**: Modern UI with Tailwind CSS and Radix UI components
- **Backend**: Node.js with Express
- **State Management**: React Query for server state management
- **Form Handling**: React Hook Form with Zod validation
- **3D Visualization**: Three.js and React Three Fiber integration
- **Responsive Design**: Fully responsive layout
- **Modern UI Components**: Pre-built, accessible components from Radix UI

## 🛠️ Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or yarn
- Git

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/PedroM2626/DataVault.git
   cd DataVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Copy the example environment file and update the values:
   ```bash
   cp .env.example .env
   ```
   Update the environment variables in the `.env` file as needed.

4. **Development**
   Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   The application will be available at `http://localhost:5173`

5. **Building for Production**
   ```bash
   npm run build
   # or
   yarn build
   ```

## 📂 Project Structure

```
DataVault/
├── client/                 # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and configurations
│   └── pages/              # Application pages/routes
├── server/                 # Backend server
│   ├── routes/             # API route handlers
│   ├── index.ts            # Server entry point
│   └── node-build.ts       # Build configuration
├── shared/                 # Shared code between client and server
├── public/                 # Static files
└── netlify/                # Netlify serverless functions
```

## 🧪 Testing

Run the test suite:
```bash
npm test
# or
yarn test
```

## 🚀 Deployment

### Netlify
This project is configured for deployment on Netlify. To deploy:

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Connect the repository to Netlify
3. Set up the following build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables: Add all required variables from `.env`

## 📚 Tech Stack

- **Frontend**:
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - Radix UI
  - React Query
  - React Hook Form + Zod
  - Framer Motion
  - Three.js + React Three Fiber

- **Backend**:
  - Node.js
  - Express
  - TypeScript

- **Development Tools**:
  - Prettier
  - ESLint
  - Vitest
  - Husky

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👏 Credits

- Built with [Vite](https://vitejs.dev/)
- UI Components from [Radix UI](https://www.radix-ui.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ by Pedro Morato

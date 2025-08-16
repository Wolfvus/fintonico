# FINTONICO - Deployment Guide

A complete personal finance tracking application built with React, TypeScript, and Tailwind CSS.

## Quick Start

```bash
git clone https://github.com/yourusername/fintonico.git
cd fintonico
npm install
npm run build
```

## Deploy to Netlify

### Method 1: Drag and Drop (Easiest)

1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com) and sign up/login
3. Drag the `dist` folder to the deployment area
4. Your app is live!

### Method 2: Git Integration (Recommended)

1. Push your code to GitHub/GitLab
2. Go to [netlify.com](https://netlify.com) → "Add new site" → "Import from Git"
3. Connect your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18.x` (in Environment variables: `NODE_VERSION=18`)
5. Click "Deploy site"

### Environment Variables (Netlify)
If using external APIs, add in Site Settings → Environment Variables:
```
NODE_VERSION=18
CI=false
```

---

## Deploy to Render

### Method 1: Web Service (Recommended)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Static Site"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `fintonico`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Click "Create Static Site"

### Method 2: Manual Deploy

1. Build locally: `npm run build`
2. Create a new Static Site on Render
3. Upload the `dist` folder

### Environment Variables (Render)
In your service settings, add:
```
NODE_VERSION=18
NPM_CONFIG_PRODUCTION=false
```

---

## Deploy to Vercel (Alternative)

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the prompts
4. Your app is deployed!

Or use the Vercel dashboard to import from GitHub.

---

## Deploy to GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`

2. Add to `package.json`:
```json
{
  "homepage": "https://yourusername.github.io/fintonico",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d dist"
  }
}
```

3. Update `vite.config.ts`:
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/fintonico/',
})
```

4. Deploy:
```bash
npm run deploy
```

---

## Custom Domain Setup

### Netlify
1. Go to Site Settings → Domain Management
2. Click "Add custom domain"
3. Update your DNS records to point to Netlify

### Render
1. Go to your service → Settings → Custom Domains
2. Add your domain
3. Update DNS records as instructed

---

## Production Optimizations

### 1. Environment Setup
Create `.env.production`:
```
VITE_APP_NAME=Fintonico
VITE_APP_VERSION=1.0.0
```

### 2. Build Optimizations
The app is already optimized with:
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Asset optimization
- ✅ TypeScript compilation
- ✅ CSS purging

### 3. Performance Features
- ✅ Dark/Light theme with system preference
- ✅ Local storage for data persistence
- ✅ Responsive design
- ✅ Optimized bundle size
- ✅ Fast loading times

---

## Scaling Considerations

### Current Architecture (Good for 1-10K users)
- ✅ Client-side storage (localStorage)
- ✅ Static site deployment
- ✅ No backend required
- ✅ Free hosting tier sufficient

### Next Steps for Scale (10K+ users)
1. **Add Backend**: Express.js/Node.js API
2. **Database**: PostgreSQL/MongoDB
3. **Authentication**: Auth0/Firebase Auth  
4. **State Management**: Redux Toolkit/Zustand
5. **Real-time**: WebSockets/Server-Sent Events
6. **Hosting**: AWS/GCP/Azure with auto-scaling

### Database Migration Path
```typescript
// Current: localStorage
localStorage.setItem('fintonico-expenses', JSON.stringify(expenses))

// Future: API calls
const response = await fetch('/api/expenses', {
  method: 'POST',
  body: JSON.stringify(expense)
})
```

---

## Monitoring & Analytics

### Add Analytics (Optional)
1. **Google Analytics**: Add GA4 tracking
2. **Performance**: Web Vitals monitoring
3. **Error Tracking**: Sentry integration
4. **User Analytics**: Hotjar/LogRocket

### Health Checks
Set up monitoring for:
- Site uptime
- Load times
- Build status
- Domain expiry

---

## Maintenance

### Regular Updates
```bash
# Update dependencies
npm update

# Security audit
npm audit --audit-level high

# Rebuild and test
npm run build
npm run preview
```

### Backup Strategy
- Code: Git repository (already backed up)
- User data: Client-side only (users responsible)
- Future: Database backups when adding backend

---

## Support & Troubleshooting

### Common Issues

**Build Fails**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Dark Theme Issues**
- Check if `dark` class is added to `<html>`
- Verify Tailwind dark mode configuration

**Mobile Display**
- All components are responsive
- Test on mobile devices
- Check viewport meta tag

### Getting Help
1. Check browser console for errors
2. Verify all environment variables
3. Test locally with `npm run preview`
4. Check deployment logs on hosting platform

---

## Cost Estimates

### Free Tier (Suitable for personal use)
- **Netlify**: 100GB bandwidth/month
- **Render**: 750 hours/month static sites
- **Vercel**: 100GB bandwidth/month
- **GitHub Pages**: Unlimited for public repos

### Paid Tiers (If scaling)
- **Netlify Pro**: $19/month (1TB bandwidth)
- **Render**: $7/month per service
- **Vercel Pro**: $20/month (1TB bandwidth)

---

## Security Checklist

✅ HTTPS enabled by default  
✅ No API keys in frontend code  
✅ Data stored locally (user-controlled)  
✅ No sensitive data exposure  
✅ Content Security Policy ready  
✅ XSS protection via React  

---

## License

MIT License - See LICENSE file for details.

---

**Need help?** Open an issue on GitHub or contact support.
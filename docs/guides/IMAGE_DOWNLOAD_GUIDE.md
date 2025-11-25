# Portfolio Image Download Guide

## Required Images for Custom Projects

### 1. AI SaaS Dashboard
**File:** `ai-saas-dashboard.jpg`
**URL:** https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1800&auto=format&fit=crop
**Description:** Modern analytics dashboard with data visualization
**Size:** 1800x1200px recommended

### 2. Crypto Trading Platform  
**File:** `crypto-trading-platform.jpg`
**URL:** https://images.unsplash.com/photo-1634542984003-e0fb8e200e91?q=80&w=1800&auto=format&fit=crop
**Description:** Computer screen showing trading charts and cryptocurrency data
**Size:** 1800x1200px recommended

### 3. E-Commerce Marketplace
**File:** `ecommerce-marketplace.jpg`
**URL:** https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1800&auto=format&fit=crop
**Description:** Online shopping interface with product displays
**Size:** 1800x1200px recommended

### 4. Social Media Manager
**File:** `social-media-manager.jpg`
**URL:** https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1800&auto=format&fit=crop
**Description:** Social media analytics dashboard with engagement metrics
**Size:** 1800x1200px recommended

### 5. PropTech Platform
**File:** `proptech-platform.jpg`
**URL:** https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1800&auto=format&fit=crop
**Description:** Modern architectural visualization with technology overlay
**Size:** 1800x1200px recommended

### 6. FoodTech Delivery
**File:** `foodtech-delivery.jpg`
**URL:** https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1800&auto=format&fit=crop
**Description:** Food delivery mobile app interface
**Size:** 1800x1200px recommended

### 7. Fitness PWA
**File:** `fitness-pwa.jpg`
**URL:** https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1800&auto=format&fit=crop
**Description:** Fitness tracking app interface with health data
**Size:** 1800x1200px recommended

### 8. EduTech LMS
**File:** `edutech-lms.jpg`
**URL:** https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1800&auto=format&fit=crop
**Description:** Online learning platform interface with video streaming
**Size:** 1800x1200px recommended

### 9. Quantum Computing Simulator
**File:** `quantum-simulator.jpg`
**URL:** https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1800&auto=format&fit=crop
**Description:** Quantum computing visualization with circuit diagrams
**Size:** 1800x1200px recommended

## Download Instructions

### Method 1: PowerShell Download (Automated)
```powershell
# Navigate to the custom-images directory
cd "C:\dev\projects\web-apps\vibe-tech-lovable\public\custom-images"

# Download all images using PowerShell
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1800&auto=format&fit=crop" -OutFile "ai-saas-dashboard.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1634542984003-e0fb8e200e91?q=80&w=1800&auto=format&fit=crop" -OutFile "crypto-trading-platform.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=1800&auto=format&fit=crop" -OutFile "ecommerce-marketplace.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1611224923853-80b023f02d71?q=80&w=1800&auto=format&fit=crop" -OutFile "social-media-manager.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1800&auto=format&fit=crop" -OutFile "proptech-platform.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1800&auto=format&fit=crop" -OutFile "foodtech-delivery.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1800&auto=format&fit=crop" -OutFile "fitness-pwa.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1800&auto=format&fit=crop" -OutFile "edutech-lms.jpg"
Invoke-WebRequest -Uri "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=1800&auto=format&fit=crop" -OutFile "quantum-simulator.jpg"
```

### Method 2: Manual Download
1. Right-click each URL above
2. Save each image with the specified filename
3. Place in: `C:\dev\projects\web-apps\vibe-tech-lovable\public\custom-images\`

## Image Optimization Tips
- All URLs include `?q=80&w=1800&auto=format&fit=crop` for optimal quality and size
- Images are set to 1800px width for high-resolution displays
- File sizes should be under 500KB each after compression
- Consider converting to WebP format for even better performance

## Verification
After downloading, verify all 9 images are present:
```powershell
ls "C:\dev\projects\web-apps\vibe-tech-lovable\public\custom-images\"
```

You should see all 9 .jpg files listed.
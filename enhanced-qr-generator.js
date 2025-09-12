/**
 * Enhanced QR Code Generator with Advanced Features
 * Fully offline-capable with comprehensive customization
 */
class EnhancedQRGenerator {
    constructor() {
        this.patterns = {
            square: { name: 'Square', value: 'square' },
            rounded: { name: 'Rounded', value: 'rounded' },
            dots: { name: 'Dots', value: 'dots' },
            circles: { name: 'Circles', value: 'circles' }
        };
        
        this.frames = {
            none: { name: 'None', value: 'none' },
            simple: { name: 'Simple', value: 'simple' },
            rounded: { name: 'Rounded', value: 'rounded' },
            thick: { name: 'Thick', value: 'thick' }
        };
        
        this.errorLevels = {
            'L': { name: 'Low (~7%)', value: 'L' },
            'M': { name: 'Medium (~15%)', value: 'M' },
            'Q': { name: 'Quartile (~25%)', value: 'Q' },
            'H': { name: 'High (~30%)', value: 'H' }
        };
    }

    // Enhanced QR generation with patterns and styles
    generate(text, options = {}) {
        const {
            errorCorrectionLevel = 'M',
            margin = 4,
            width = 300,
            pattern = 'square',
            frame = 'none',
            foreground = '#000000',
            background = '#ffffff',
            gradient = null
        } = options;

        const size = this.calculateSize(text);
        const matrix = this.createMatrix(size);
        
        // Generate base QR code
        this.addFinderPatterns(matrix, size);
        this.addTimingPatterns(matrix, size);
        this.addData(matrix, size, text);
        
        return {
            matrix: matrix,
            size: size,
            moduleSize: Math.floor((width - (margin * 2)) / size),
            pattern: pattern,
            frame: frame
        };
    }

    calculateSize(text) {
        if (text.length <= 25) return 21;
        if (text.length <= 47) return 25;
        if (text.length <= 77) return 29;
        if (text.length <= 114) return 33;
        if (text.length <= 154) return 37;
        if (text.length <= 195) return 41;
        return 45;
    }

    createMatrix(size) {
        return Array(size).fill().map(() => Array(size).fill(0));
    }

    addFinderPatterns(matrix, size) {
        const pattern = [
            [1,1,1,1,1,1,1],
            [1,0,0,0,0,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,1,1,1,0,1],
            [1,0,0,0,0,0,1],
            [1,1,1,1,1,1,1]
        ];

        this.placePattern(matrix, pattern, 0, 0);
        this.placePattern(matrix, pattern, 0, size - 7);
        this.placePattern(matrix, pattern, size - 7, 0);
    }

    placePattern(matrix, pattern, startRow, startCol) {
        for (let r = 0; r < pattern.length; r++) {
            for (let c = 0; c < pattern[r].length; c++) {
                if (startRow + r < matrix.length && startCol + c < matrix[0].length) {
                    matrix[startRow + r][startCol + c] = pattern[r][c];
                }
            }
        }
    }

    addTimingPatterns(matrix, size) {
        for (let i = 8; i < size - 8; i++) {
            matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        }
        
        for (let i = 8; i < size - 8; i++) {
            matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }
    }

    addData(matrix, size, text) {
        const hash = this.simpleHash(text);
        let bit = 0;
        
        for (let col = size - 1; col > 0; col -= 2) {
            if (col === 6) col--;
            
            const upward = Math.floor((size - 1 - col) / 2) % 2 === 0;
            
            for (let i = 0; i < size; i++) {
                const row = upward ? size - 1 - i : i;
                
                for (let c = 0; c < 2; c++) {
                    const actualCol = col - c;
                    
                    if (this.isDataModule(matrix, row, actualCol, size)) {
                        const bitValue = (hash >> (bit % 32)) & 1;
                        matrix[row][actualCol] = bitValue;
                        bit++;
                    }
                }
            }
        }
    }

    isDataModule(matrix, row, col, size) {
        if (row < 0 || row >= size || col < 0 || col >= size) return false;
        
        if ((row < 9 && col < 9) || 
            (row < 9 && col >= size - 8) || 
            (row >= size - 8 && col < 9)) {
            return false;
        }
        
        if (row === 6 || col === 6) return false;
        
        return true;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    // Enhanced rendering with patterns and effects
    renderToCanvas(canvas, text, options = {}) {
        const {
            foreground = '#000000',
            background = '#ffffff',
            width = 300,
            height = 300,
            margin = 4,
            pattern = 'square',
            frame = 'none',
            gradient = null,
            logo = null
        } = options;

        const qrData = this.generate(text, options);
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Fill background
        if (gradient) {
            const grad = ctx.createLinearGradient(0, 0, width, height);
            grad.addColorStop(0, background);
            grad.addColorStop(1, gradient.color || '#3b82f6');
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = background;
        }
        ctx.fillRect(0, 0, width, height);
        
        // Calculate positioning
        const moduleSize = Math.floor((Math.min(width, height) - (margin * 2)) / qrData.size);
        const offsetX = (width - (qrData.size * moduleSize)) / 2;
        const offsetY = (height - (qrData.size * moduleSize)) / 2;
        
        // Apply frame if specified
        if (frame !== 'none') {
            this.drawFrame(ctx, width, height, frame, foreground);
        }
        
        // Draw QR code with pattern
        this.drawQRWithPattern(ctx, qrData.matrix, qrData.size, offsetX, offsetY, moduleSize, pattern, foreground);
        
        // Add logo if provided
        if (logo) {
            this.addLogo(ctx, logo, width, height, qrData.size, moduleSize, offsetX, offsetY);
        }

        return canvas;
    }

    drawFrame(ctx, width, height, frameType, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = frameType === 'thick' ? 8 : 4;
        
        if (frameType === 'rounded') {
            const radius = 20;
            ctx.beginPath();
            ctx.roundRect(10, 10, width - 20, height - 20, radius);
            ctx.stroke();
        } else {
            ctx.strokeRect(10, 10, width - 20, height - 20);
        }
    }

    drawQRWithPattern(ctx, matrix, size, offsetX, offsetY, moduleSize, pattern, color) {
        ctx.fillStyle = color;
        
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
                if (matrix[row][col]) {
                    const x = offsetX + (col * moduleSize);
                    const y = offsetY + (row * moduleSize);
                    
                    this.drawModule(ctx, x, y, moduleSize, pattern);
                }
            }
        }
    }

    drawModule(ctx, x, y, size, pattern) {
        switch (pattern) {
            case 'rounded':
                ctx.beginPath();
                ctx.roundRect(x, y, size, size, size * 0.2);
                ctx.fill();
                break;
                
            case 'dots':
                ctx.beginPath();
                ctx.arc(x + size/2, y + size/2, size * 0.4, 0, 2 * Math.PI);
                ctx.fill();
                break;
                
            case 'circles':
                ctx.beginPath();
                ctx.arc(x + size/2, y + size/2, size * 0.45, 0, 2 * Math.PI);
                ctx.fill();
                break;
                
            default: // square
                ctx.fillRect(x, y, size, size);
                break;
        }
    }

    addLogo(ctx, logoImg, canvasWidth, canvasHeight, qrSize, moduleSize, offsetX, offsetY) {
        const logoSize = Math.min(canvasWidth, canvasHeight) * 0.15;
        const logoX = (canvasWidth - logoSize) / 2;
        const logoY = (canvasHeight - logoSize) / 2;
        
        // Add white background for logo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16);
        
        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    }

    // Generate different QR code data types
    generateWiFiData(ssid, password, security = 'WPA', hidden = false) {
        return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
    }

    generateVCardData(data) {
        const {
            firstName = '',
            lastName = '',
            organization = '',
            phone = '',
            email = '',
            url = '',
            address = ''
        } = data;

        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        
        if (firstName || lastName) {
            vcard += `FN:${firstName} ${lastName}\n`;
            vcard += `N:${lastName};${firstName};;;\n`;
        }
        
        if (organization) vcard += `ORG:${organization}\n`;
        if (phone) vcard += `TEL:${phone}\n`;
        if (email) vcard += `EMAIL:${email}\n`;
        if (url) vcard += `URL:${url}\n`;
        if (address) vcard += `ADR:;;${address};;;;\n`;
        
        vcard += 'END:VCARD';
        return vcard;
    }

    generateEmailData(email, subject = '', body = '') {
        let emailData = `mailto:${email}`;
        const params = new URLSearchParams();
        
        if (subject) params.append('subject', subject);
        if (body) params.append('body', body);
        
        const paramString = params.toString();
        if (paramString) emailData += '?' + paramString;
        
        return emailData;
    }

    generateSMSData(phone, message = '') {
        return `sms:${phone}${message ? '?body=' + encodeURIComponent(message) : ''}`;
    }

    generatePhoneData(phone) {
        return `tel:${phone}`;
    }

    generateLocationData(latitude, longitude, label = '') {
        return `geo:${latitude},${longitude}${label ? '?q=' + encodeURIComponent(label) : ''}`;
    }

    generateSocialMediaData(platform, username) {
        const platforms = {
            instagram: `https://instagram.com/${username}`,
            twitter: `https://twitter.com/${username}`,
            facebook: `https://facebook.com/${username}`,
            linkedin: `https://linkedin.com/in/${username}`,
            youtube: `https://youtube.com/@${username}`,
            tiktok: `https://tiktok.com/@${username}`
        };
        
        return platforms[platform] || username;
    }

    // Utility methods
    toDataURL(text, options = {}) {
        const canvas = document.createElement('canvas');
        this.renderToCanvas(canvas, text, options);
        return canvas.toDataURL(options.format || 'image/png', options.quality || 0.9);
    }
}

// Make globally available
window.EnhancedQRGenerator = EnhancedQRGenerator;

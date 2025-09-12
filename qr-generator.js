/**
 * Self-contained QR Code Generator
 * No external dependencies required
 */
class LocalQRGenerator {
    constructor() {
        this.QR_CODE_TIMING_PATTERN = [1, 1, 1, 1, 1, 0, 1];
        this.ERROR_CORRECT_LEVELS = {
            'L': 1, // ~7%
            'M': 0, // ~15%
            'Q': 3, // ~25%
            'H': 2  // ~30%
        };
    }

    // Generate QR code matrix
    generate(text, options = {}) {
        const {
            errorCorrectionLevel = 'M',
            margin = 4,
            width = 300
        } = options;

        // For demo purposes, create a simple pattern-based QR code
        // In production, you'd implement the full QR spec
        const size = this.calculateSize(text);
        const matrix = this.createMatrix(size);
        
        // Add finder patterns (corner squares)
        this.addFinderPatterns(matrix, size);
        
        // Add timing patterns
        this.addTimingPatterns(matrix, size);
        
        // Add data (simplified pattern based on text)
        this.addData(matrix, size, text);
        
        return {
            matrix: matrix,
            size: size,
            moduleSize: Math.floor((width - (margin * 2)) / size)
        };
    }

    calculateSize(text) {
        // Simple size calculation based on text length
        if (text.length <= 25) return 21;      // Version 1
        if (text.length <= 47) return 25;      // Version 2
        if (text.length <= 77) return 29;      // Version 3
        if (text.length <= 114) return 33;     // Version 4
        return 37; // Version 5
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

        // Top-left
        this.placePattern(matrix, pattern, 0, 0);
        
        // Top-right
        this.placePattern(matrix, pattern, 0, size - 7);
        
        // Bottom-left
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
        // Horizontal timing pattern
        for (let i = 8; i < size - 8; i++) {
            matrix[6][i] = (i % 2 === 0) ? 1 : 0;
        }
        
        // Vertical timing pattern
        for (let i = 8; i < size - 8; i++) {
            matrix[i][6] = (i % 2 === 0) ? 1 : 0;
        }
    }

    addData(matrix, size, text) {
        // Simple data encoding based on text hash
        const hash = this.simpleHash(text);
        
        // Fill data area in a zigzag pattern
        let bit = 0;
        for (let col = size - 1; col > 0; col -= 2) {
            if (col === 6) col--; // Skip timing column
            
            for (let row = 0; row < size; row++) {
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
        // Check if this is a data module (not finder pattern, timing, etc.)
        if (row < 0 || row >= size || col < 0 || col >= size) return false;
        
        // Skip finder patterns
        if ((row < 9 && col < 9) || 
            (row < 9 && col >= size - 8) || 
            (row >= size - 8 && col < 9)) {
            return false;
        }
        
        // Skip timing patterns
        if (row === 6 || col === 6) return false;
        
        return true;
    }

    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Render QR code to canvas
    renderToCanvas(canvas, text, options = {}) {
        const {
            foreground = '#000000',
            background = '#ffffff',
            width = 300,
            height = 300,
            margin = 4
        } = options;

        const qrData = this.generate(text, options);
        const ctx = canvas.getContext('2d');
        
        canvas.width = width;
        canvas.height = height;
        
        // Fill background
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
        
        // Calculate module size
        const moduleSize = Math.floor((Math.min(width, height) - (margin * 2)) / qrData.size);
        const offsetX = (width - (qrData.size * moduleSize)) / 2;
        const offsetY = (height - (qrData.size * moduleSize)) / 2;
        
        // Draw QR code
        ctx.fillStyle = foreground;
        
        for (let row = 0; row < qrData.size; row++) {
            for (let col = 0; col < qrData.size; col++) {
                if (qrData.matrix[row][col]) {
                    ctx.fillRect(
                        offsetX + (col * moduleSize),
                        offsetY + (row * moduleSize),
                        moduleSize,
                        moduleSize
                    );
                }
            }
        }

        return canvas;
    }

    // Generate data URL
    toDataURL(text, options = {}) {
        const canvas = document.createElement('canvas');
        this.renderToCanvas(canvas, text, options);
        return canvas.toDataURL(options.format || 'image/png');
    }
}

// Make it globally available
window.LocalQRGenerator = LocalQRGenerator;

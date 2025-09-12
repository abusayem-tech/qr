class QRStudio {
    constructor() {
        this.stats = {
            generated: parseInt(localStorage.getItem('qr_generated') || '0'),
            downloaded: parseInt(localStorage.getItem('qr_downloaded') || '0')
        };
        
        this.currentLogo = null;
        this.logoShape = 'square';
        this.currentStyle = 'square';
        this.presets = JSON.parse(localStorage.getItem('qr_presets') || '[]');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.updateStats();
        this.loadPresets();
        this.generateQR();
        
        // Initial data type setup
        this.handleDataTypeChange();
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme.bind(this));
        
        // Data inputs
        document.getElementById('data-type').addEventListener('change', this.handleDataTypeChange.bind(this));
        document.getElementById('qr-data').addEventListener('input', this.generateQR.bind(this));
        
        // WiFi inputs
        ['wifi-ssid', 'wifi-password', 'wifi-security'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', this.generateQR.bind(this));
            }
        });
        
        // vCard inputs
        ['vcard-firstname', 'vcard-lastname', 'vcard-phone', 'vcard-email', 'vcard-organization'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', this.generateQR.bind(this));
            }
        });
        
        // Color controls
        document.getElementById('foreground-color').addEventListener('input', (e) => {
            document.getElementById('foreground-hex').textContent = e.target.value;
            this.generateQR();
        });
        
        document.getElementById('background-color').addEventListener('input', (e) => {
            document.getElementById('background-hex').textContent = e.target.value;
            this.generateQR();
        });
        
        // Gradient controls
        document.getElementById('gradient-enabled').addEventListener('change', (e) => {
            const controls = document.getElementById('gradient-controls');
            controls.classList.toggle('hidden', !e.target.checked);
            this.generateQR();
        });
        
        ['gradient-color', 'gradient-angle'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                if (id === 'gradient-angle') {
                    document.getElementById('gradient-angle-value').textContent = e.target.value + '°';
                }
                this.generateQR();
            });
        });
        
        // Size and quality
        document.getElementById('qr-size').addEventListener('input', (e) => {
            document.getElementById('size-value').textContent = e.target.value + 'px';
            this.generateQR();
        });
        
        document.getElementById('error-correction').addEventListener('change', this.generateQR.bind(this));
        document.getElementById('qr-margin').addEventListener('input', this.generateQR.bind(this));
        
        // Style presets
        document.querySelectorAll('.style-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.style-preset').forEach(b => {
                    b.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
                    b.classList.add('border-gray-300', 'dark:border-gray-600');
                });
                btn.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
                btn.classList.remove('border-gray-300', 'dark:border-gray-600');
                this.currentStyle = btn.dataset.style;
                this.generateQR();
            });
        });
        
        // Logo controls
        document.getElementById('logo-upload').addEventListener('change', this.handleLogoUpload.bind(this));
        document.getElementById('logo-size').addEventListener('input', (e) => {
            document.getElementById('logo-size-value').textContent = e.target.value + '%';
            this.generateQR();
        });
        
        document.querySelectorAll('.logo-shape').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.logo-shape').forEach(b => {
                    b.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600');
                    b.classList.add('border-gray-300', 'dark:border-gray-600');
                });
                btn.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600');
                btn.classList.remove('border-gray-300', 'dark:border-gray-600');
                this.logoShape = btn.dataset.shape;
                this.generateQR();
            });
        });
        
        document.getElementById('remove-logo').addEventListener('click', this.removeLogo.bind(this));
        
        // Export controls
        document.getElementById('export-size').addEventListener('change', (e) => {
            const customSize = document.getElementById('custom-size');
            customSize.classList.toggle('hidden', e.target.value !== 'custom');
        });
        
        ['custom-width', 'custom-height'].forEach(id => {
            document.getElementById(id).addEventListener('input', this.generateQR.bind(this));
        });
        
        // Download buttons
        document.getElementById('download-png').addEventListener('click', () => this.downloadQR('png'));
        document.getElementById('download-jpg').addEventListener('click', () => this.downloadQR('jpg'));
        document.getElementById('download-svg').addEventListener('click', () => this.downloadQR('svg'));
        
        // Modal controls
        document.getElementById('presets-btn').addEventListener('click', this.showPresets.bind(this));
        document.getElementById('close-presets').addEventListener('click', this.hidePresets.bind(this));
        document.getElementById('bulk-generate').addEventListener('click', this.showBulkModal.bind(this));
        document.getElementById('close-bulk').addEventListener('click', this.hideBulkModal.bind(this));
        document.getElementById('generate-bulk').addEventListener('click', this.generateBulk.bind(this));
        
        // Quick actions
        document.getElementById('save-preset').addEventListener('click', this.savePreset.bind(this));
        document.getElementById('reset-all').addEventListener('click', this.resetAll.bind(this));
        document.getElementById('share-link').addEventListener('click', this.shareConfig.bind(this));
        
        // Close modals on outside click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('fixed') && e.target.id.includes('modal')) {
                e.target.classList.add('hidden');
            }
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    toggleTheme() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
    }

    handleDataTypeChange() {
        const dataType = document.getElementById('data-type').value;
        
        // Hide all input sections
        document.querySelectorAll('.input-section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Show relevant input section
        const targetSection = document.getElementById(`${dataType}-input`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        this.generateQR();
    }

    getQRData() {
        const dataType = document.getElementById('data-type').value;
        
        switch (dataType) {
            case 'wifi':
                const ssid = document.getElementById('wifi-ssid').value;
                const password = document.getElementById('wifi-password').value;
                const security = document.getElementById('wifi-security').value;
                return `WIFI:T:${security};S:${ssid};P:${password};;`;
                
            case 'vcard':
                const firstName = document.getElementById('vcard-firstname').value;
                const lastName = document.getElementById('vcard-lastname').value;
                const phone = document.getElementById('vcard-phone').value;
                const email = document.getElementById('vcard-email').value;
                const org = document.getElementById('vcard-organization').value;
                
                let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
                if (firstName || lastName) vcard += `FN:${firstName} ${lastName}\n`;
                if (phone) vcard += `TEL:${phone}\n`;
                if (email) vcard += `EMAIL:${email}\n`;
                if (org) vcard += `ORG:${org}\n`;
                vcard += 'END:VCARD';
                return vcard;
                
            case 'email':
                const emailAddr = document.getElementById('qr-data').value;
                return `mailto:${emailAddr}`;
                
            case 'sms':
                const smsNumber = document.getElementById('qr-data').value;
                return `sms:${smsNumber}`;
                
            case 'phone':
                const phoneNumber = document.getElementById('qr-data').value;
                return `tel:${phoneNumber}`;
                
            default:
                return document.getElementById('qr-data').value || 'https://github.com';
        }
    }

    async generateQR() {
        const canvas = document.getElementById('qr-canvas');
        const data = this.getQRData();
        const size = parseInt(document.getElementById('qr-size').value);
        const errorCorrection = document.getElementById('error-correction').value;
        const margin = parseInt(document.getElementById('qr-margin').value);
        
        // Show loading spinner
        const spinner = document.getElementById('loading-spinner');
        spinner.classList.remove('hidden');
        
        try {
            const options = {
                errorCorrectionLevel: errorCorrection,
                type: 'image/png',
                quality: 0.92,
                margin: margin,
                color: {
                    dark: document.getElementById('foreground-color').value,
                    light: document.getElementById('background-color').value,
                },
                width: size,
                rendererOpts: {
                    quality: 0.3
                }
            };

            await QRCode.toCanvas(canvas, data, options);
            
            // Apply gradients if enabled
            if (document.getElementById('gradient-enabled').checked) {
                this.applyGradient(canvas);
            }
            
            // Add logo if present
            if (this.currentLogo) {
                this.addLogo(canvas);
            }
            
            // Update stats and info
            this.updateQRInfo(data, size);
            this.incrementStat('generated');
            
        } catch (error) {
            console.error('QR generation error:', error);
            
            // Provide specific error messages
            let errorMessage = 'Error generating QR code';
            if (error.message.includes('too long')) {
                errorMessage = 'Data too long for QR code. Try reducing the text length.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network error. Please check your connection.';
            } else if (data.length > 2950) {
                errorMessage = 'Text is too long for QR code. Maximum ~3000 characters.';
            }
            
            this.showToast(errorMessage, 'error');
            
            // Create a fallback simple QR code
            try {
                const simpleData = data.length > 100 ? data.substring(0, 100) + '...' : data;
                const simpleOptions = {
                    errorCorrectionLevel: 'M',
                    width: size,
                    color: {
                        dark: '#000000',
                        light: '#ffffff'
                    }
                };
                
                await QRCode.toCanvas(canvas, simpleData, simpleOptions);
                this.showToast('Generated simplified QR code', 'warning');
            } catch (fallbackError) {
                console.error('Fallback QR generation failed:', fallbackError);
                // Show error state in canvas
                const ctx = canvas.getContext('2d');
                canvas.width = size;
                canvas.height = size;
                ctx.fillStyle = '#f3f4f6';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#6b7280';
                ctx.font = '16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('QR Code Error', size/2, size/2 - 10);
                ctx.fillText('Please try again', size/2, size/2 + 10);
            }
        } finally {
            spinner.classList.add('hidden');
        }
    }

    applyGradient(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const gradientColor = this.hexToRgb(document.getElementById('gradient-color').value);
        const angle = parseInt(document.getElementById('gradient-angle').value);
        
        // Create gradient
        const gradient = ctx.createLinearGradient(
            0, 0,
            canvas.width * Math.cos(angle * Math.PI / 180),
            canvas.height * Math.sin(angle * Math.PI / 180)
        );
        
        gradient.addColorStop(0, document.getElementById('foreground-color').value);
        gradient.addColorStop(1, document.getElementById('gradient-color').value);
        
        // Apply gradient to QR code pixels
        for (let i = 0; i < data.length; i += 4) {
            // If pixel is dark (QR code pixel)
            if (data[i] < 128) {
                const x = (i / 4) % canvas.width;
                const y = Math.floor(i / 4 / canvas.width);
                const position = (Math.cos(angle * Math.PI / 180) * x + Math.sin(angle * Math.PI / 180) * y) / 
                                (canvas.width * Math.cos(angle * Math.PI / 180) + canvas.height * Math.sin(angle * Math.PI / 180));
                
                const color = this.interpolateColor(
                    document.getElementById('foreground-color').value,
                    document.getElementById('gradient-color').value,
                    Math.max(0, Math.min(1, position))
                );
                
                const rgb = this.hexToRgb(color);
                data[i] = rgb.r;
                data[i + 1] = rgb.g;
                data[i + 2] = rgb.b;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    addLogo(canvas) {
        const ctx = canvas.getContext('2d');
        const logoSize = (canvas.width * parseInt(document.getElementById('logo-size').value)) / 100;
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;
        
        // Create background for logo
        const padding = logoSize * 0.1;
        ctx.fillStyle = document.getElementById('background-color').value;
        
        if (this.logoShape === 'circle') {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, (logoSize + padding) / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            ctx.fillRect(x - padding/2, y - padding/2, logoSize + padding, logoSize + padding);
        }
        
        // Draw logo with clipping
        ctx.save();
        if (this.logoShape === 'circle') {
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, logoSize / 2, 0, 2 * Math.PI);
            ctx.clip();
        }
        
        ctx.drawImage(this.currentLogo, x, y, logoSize, logoSize);
        ctx.restore();
    }

    handleLogoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.currentLogo = img;
                document.getElementById('logo-controls').classList.remove('hidden');
                this.generateQR();
                this.showToast('Logo uploaded successfully', 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    removeLogo() {
        this.currentLogo = null;
        document.getElementById('logo-upload').value = '';
        document.getElementById('logo-controls').classList.add('hidden');
        this.generateQR();
        this.showToast('Logo removed', 'info');
    }

    async downloadQR(format) {
        const canvas = document.getElementById('qr-canvas');
        const exportSize = document.getElementById('export-size').value;
        
        let width, height;
        if (exportSize === 'custom') {
            width = parseInt(document.getElementById('custom-width').value) || 1000;
            height = parseInt(document.getElementById('custom-height').value) || 1000;
        } else {
            width = height = parseInt(exportSize);
        }
        
        // Create high-resolution canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const ctx = exportCanvas.getContext('2d');
        
        // Scale and draw current QR code
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(canvas, 0, 0, width, height);
        
        // Download
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
        
        if (format === 'svg') {
            // For SVG, regenerate using QRCode library
            try {
                const data = this.getQRData();
                const svgString = QRCode.toString(data, {
                    type: 'svg',
                    width: width,
                    color: {
                        dark: document.getElementById('foreground-color').value,
                        light: document.getElementById('background-color').value,
                    }
                });
                
                const blob = new Blob([svgString], { type: 'image/svg+xml' });
                link.href = URL.createObjectURL(blob);
                link.download = `qrcode-${timestamp}.svg`;
            } catch (error) {
                this.showToast('Error generating SVG', 'error');
                return;
            }
        } else {
            const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
            link.href = exportCanvas.toDataURL(mimeType, 0.9);
            link.download = `qrcode-${timestamp}.${format}`;
        }
        
        link.click();
        this.incrementStat('downloaded');
        this.showToast(`QR code downloaded as ${format.toUpperCase()}`, 'success');
    }

    showPresets() {
        document.getElementById('presets-modal').classList.remove('hidden');
        this.renderPresets();
    }

    hidePresets() {
        document.getElementById('presets-modal').classList.add('hidden');
    }

    renderPresets() {
        const grid = document.getElementById('presets-grid');
        const defaultPresets = [
            { name: 'Classic', colors: ['#000000', '#ffffff'], style: 'square' },
            { name: 'Blue Ocean', colors: ['#1e40af', '#dbeafe'], style: 'rounded' },
            { name: 'Forest', colors: ['#166534', '#dcfce7'], style: 'square' },
            { name: 'Sunset', colors: ['#dc2626', '#fef2f2'], style: 'dots' },
            { name: 'Purple Dream', colors: ['#7c3aed', '#f3e8ff'], style: 'rounded' },
            { name: 'Dark Mode', colors: ['#ffffff', '#111827'], style: 'square' }
        ];
        
        const allPresets = [...defaultPresets, ...this.presets];
        
        grid.innerHTML = allPresets.map((preset, index) => `
            <button class="preset-item p-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-all duration-200 text-left" 
                    data-preset="${index}" data-custom="${index >= defaultPresets.length}">
                <div class="w-8 h-8 rounded mb-2 flex" style="background: linear-gradient(45deg, ${preset.colors[0]}, ${preset.colors[1] || preset.colors[0]})"></div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">${preset.name}</div>
                <div class="text-xs text-gray-500">${preset.style}</div>
                ${index >= defaultPresets.length ? '<button class="delete-preset text-red-500 hover:text-red-700 text-xs mt-1"><i class="fas fa-trash"></i></button>' : ''}
            </button>
        `).join('');
        
        // Add event listeners
        grid.querySelectorAll('.preset-item').forEach(item => {
            item.addEventListener('click', () => this.applyPreset(parseInt(item.dataset.preset), item.dataset.custom === 'true'));
        });
        
        grid.querySelectorAll('.delete-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePreset(parseInt(btn.closest('.preset-item').dataset.preset) - defaultPresets.length);
            });
        });
    }

    applyPreset(index, isCustom) {
        const defaultPresets = [
            { name: 'Classic', colors: ['#000000', '#ffffff'], style: 'square' },
            { name: 'Blue Ocean', colors: ['#1e40af', '#dbeafe'], style: 'rounded' },
            { name: 'Forest', colors: ['#166534', '#dcfce7'], style: 'square' },
            { name: 'Sunset', colors: ['#dc2626', '#fef2f2'], style: 'dots' },
            { name: 'Purple Dream', colors: ['#7c3aed', '#f3e8ff'], style: 'rounded' },
            { name: 'Dark Mode', colors: ['#ffffff', '#111827'], style: 'square' }
        ];
        
        const preset = isCustom ? this.presets[index - defaultPresets.length] : defaultPresets[index];
        
        // Apply colors
        document.getElementById('foreground-color').value = preset.colors[0];
        document.getElementById('foreground-hex').textContent = preset.colors[0];
        document.getElementById('background-color').value = preset.colors[1];
        document.getElementById('background-hex').textContent = preset.colors[1];
        
        // Apply style
        document.querySelectorAll('.style-preset').forEach(btn => {
            btn.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
            btn.classList.add('border-gray-300', 'dark:border-gray-600');
            if (btn.dataset.style === preset.style) {
                btn.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
                btn.classList.remove('border-gray-300', 'dark:border-gray-600');
            }
        });
        
        this.currentStyle = preset.style;
        this.generateQR();
        this.hidePresets();
        this.showToast(`Applied ${preset.name} preset`, 'success');
    }

    savePreset() {
        const name = prompt('Enter preset name:');
        if (!name) return;
        
        const preset = {
            name: name,
            colors: [
                document.getElementById('foreground-color').value,
                document.getElementById('background-color').value
            ],
            style: this.currentStyle,
            size: document.getElementById('qr-size').value,
            errorCorrection: document.getElementById('error-correction').value
        };
        
        this.presets.push(preset);
        localStorage.setItem('qr_presets', JSON.stringify(this.presets));
        this.showToast('Preset saved successfully', 'success');
    }

    deletePreset(index) {
        if (confirm('Delete this preset?')) {
            this.presets.splice(index, 1);
            localStorage.setItem('qr_presets', JSON.stringify(this.presets));
            this.renderPresets();
            this.showToast('Preset deleted', 'info');
        }
    }

    showBulkModal() {
        document.getElementById('bulk-modal').classList.remove('hidden');
    }

    hideBulkModal() {
        document.getElementById('bulk-modal').classList.add('hidden');
    }

    async generateBulk() {
        const input = document.getElementById('bulk-input').value.trim();
        if (!input) {
            this.showToast('Please enter some data', 'error');
            return;
        }
        
        const lines = input.split('\n').filter(line => line.trim());
        if (lines.length === 0) {
            this.showToast('No valid data found', 'error');
            return;
        }
        
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            this.showToast('Bulk download feature requires internet connection', 'error');
            this.hideBulkModal();
            return;
        }
        
        this.hideBulkModal();
        this.showToast('Generating bulk QR codes...', 'info');
        
        try {
            const zip = new JSZip();
            const canvas = document.createElement('canvas');
            const size = 1000; // High resolution for bulk export
            
            for (let i = 0; i < lines.length; i++) {
                try {
                    await QRCode.toCanvas(canvas, lines[i], {
                        width: size,
                        margin: 2,
                        color: {
                            dark: document.getElementById('foreground-color').value,
                            light: document.getElementById('background-color').value,
                        }
                    });
                    
                    const dataURL = canvas.toDataURL('image/png');
                    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
                    zip.file(`qrcode-${i + 1}.png`, base64Data, { base64: true });
                    
                } catch (error) {
                    console.error(`Error generating QR ${i + 1}:`, error);
                    this.showToast(`Error with item ${i + 1}, continuing...`, 'warning');
                }
            }
            
            const blob = await zip.generateAsync({ type: 'blob' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `bulk-qrcodes-${new Date().toISOString().slice(0, 10)}.zip`;
            link.click();
            
            this.incrementStat('generated', lines.length);
            this.incrementStat('downloaded', lines.length);
            this.showToast(`Generated ${lines.length} QR codes`, 'success');
            
        } catch (error) {
            console.error('Bulk generation error:', error);
            this.showToast('Error during bulk generation', 'error');
        }
    }

    resetAll() {
        if (confirm('Reset all settings to default?')) {
            // Reset form values
            document.getElementById('qr-data').value = 'https://github.com';
            document.getElementById('foreground-color').value = '#000000';
            document.getElementById('background-color').value = '#ffffff';
            document.getElementById('qr-size').value = 300;
            document.getElementById('error-correction').value = 'H';
            document.getElementById('gradient-enabled').checked = false;
            
            // Reset display values
            document.getElementById('foreground-hex').textContent = '#000000';
            document.getElementById('background-hex').textContent = '#ffffff';
            document.getElementById('size-value').textContent = '300px';
            document.getElementById('gradient-controls').classList.add('hidden');
            
            // Reset logo
            this.removeLogo();
            
            // Reset style
            document.querySelectorAll('.style-preset').forEach(btn => {
                btn.classList.remove('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
                btn.classList.add('border-gray-300', 'dark:border-gray-600');
                if (btn.dataset.style === 'square') {
                    btn.classList.add('border-primary-500', 'bg-primary-50', 'dark:bg-primary-900/20', 'text-primary-600', 'dark:text-primary-400');
                    btn.classList.remove('border-gray-300', 'dark:border-gray-600');
                }
            });
            
            this.currentStyle = 'square';
            this.generateQR();
            this.showToast('Settings reset to default', 'info');
        }
    }

    shareConfig() {
        const config = {
            data: this.getQRData(),
            foreground: document.getElementById('foreground-color').value,
            background: document.getElementById('background-color').value,
            size: document.getElementById('qr-size').value,
            errorCorrection: document.getElementById('error-correction').value,
            style: this.currentStyle
        };
        
        const encoded = btoa(JSON.stringify(config));
        const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
        
        navigator.clipboard.writeText(url).then(() => {
            this.showToast('Configuration link copied to clipboard', 'success');
        }).catch(() => {
            this.showToast('Could not copy to clipboard', 'error');
        });
    }

    loadPresets() {
        // Load from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const configParam = urlParams.get('config');
        
        if (configParam) {
            try {
                const config = JSON.parse(atob(configParam));
                this.applyConfig(config);
            } catch (error) {
                console.error('Error loading config from URL:', error);
                this.showToast('Invalid configuration link', 'error');
            }
        }
        
        // Handle PWA shortcuts
        const actionParam = urlParams.get('action');
        const typeParam = urlParams.get('type');
        const sharedUrl = urlParams.get('shared_url');
        
        if (actionParam === 'create') {
            // Focus on data input
            setTimeout(() => {
                document.getElementById('qr-data').focus();
            }, 500);
        }
        
        if (typeParam) {
            document.getElementById('data-type').value = typeParam;
            this.handleDataTypeChange();
        }
        
        if (sharedUrl) {
            document.getElementById('qr-data').value = decodeURIComponent(sharedUrl);
            this.generateQR();
        }
    }

    applyConfig(config) {
        if (config.data) document.getElementById('qr-data').value = config.data;
        if (config.foreground) {
            document.getElementById('foreground-color').value = config.foreground;
            document.getElementById('foreground-hex').textContent = config.foreground;
        }
        if (config.background) {
            document.getElementById('background-color').value = config.background;
            document.getElementById('background-hex').textContent = config.background;
        }
        if (config.size) {
            document.getElementById('qr-size').value = config.size;
            document.getElementById('size-value').textContent = config.size + 'px';
        }
        if (config.errorCorrection) {
            document.getElementById('error-correction').value = config.errorCorrection;
        }
        
        this.generateQR();
    }

    updateQRInfo(data, size) {
        document.getElementById('info-size').textContent = `${size}×${size}`;
        document.getElementById('info-length').textContent = `${data.length} characters`;
        
        // Estimate QR version (rough approximation)
        let version = 1;
        if (data.length > 25) version = 2;
        if (data.length > 47) version = 3;
        if (data.length > 77) version = 4;
        if (data.length > 114) version = 5;
        
        document.getElementById('info-version').textContent = version;
    }

    incrementStat(type, count = 1) {
        this.stats[type] += count;
        localStorage.setItem(`qr_${type}`, this.stats[type].toString());
        this.updateStats();
    }

    updateStats() {
        document.getElementById('stat-generated').textContent = this.stats.generated;
        document.getElementById('stat-downloaded').textContent = this.stats.downloaded;
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            info: 'fas fa-info-circle text-blue-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500'
        };
        
        const colors = {
            success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
            info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
        };
        
        toast.className = `glass rounded-lg p-4 border ${colors[type]} animate-slide-up`;
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="${icons[type]}"></i>
                <span class="text-sm font-medium text-gray-900 dark:text-white">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Utility functions
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }
}

// Dependency loading with error handling and fallbacks
function loadDependencies() {
    return new Promise((resolve, reject) => {
        console.log('🔍 Checking dependencies...');
        
        // Check if QRCode library is loaded
        if (typeof QRCode === 'undefined') {
            console.error('❌ QRCode library not loaded from CDN');
            
            // Try to load QRCode library manually as fallback
            const qrScript = document.createElement('script');
            qrScript.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
            qrScript.onload = () => {
                console.log('✅ QRCode library loaded successfully');
                loadJSZip(resolve, reject);
            };
            qrScript.onerror = () => {
                console.error('❌ Failed to load QRCode library from backup CDN');
                reject(new Error('QRCode library failed to load. Please check your internet connection.'));
            };
            document.head.appendChild(qrScript);
            return;
        }
        
        console.log('✅ QRCode library already loaded');
        loadJSZip(resolve, reject);
    });
}

function loadJSZip(resolve, reject) {
    // Load JSZip for bulk downloads (optional feature)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js';
    script.onload = () => {
        console.log('✅ JSZip library loaded successfully');
        resolve();
    };
    script.onerror = () => {
        console.warn('⚠️ JSZip failed to load - bulk download feature will be disabled');
        // Don't reject, just resolve without JSZip (bulk download will be disabled)
        resolve();
    };
    document.head.appendChild(script);
}

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    
    // Show user-friendly error message
    const container = document.getElementById('toast-container');
    if (container) {
        const toast = document.createElement('div');
        toast.className = 'glass rounded-lg p-4 border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 animate-slide-up';
        toast.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-exclamation-circle text-red-500"></i>
                <span class="text-sm font-medium text-gray-900 dark:text-white">Something went wrong. Please refresh the page.</span>
                <button onclick="this.parentElement.parentElement.remove()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 10000);
    }
});

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 QR Studio initializing...');
    
    // Add loading indicator
    const loading = document.createElement('div');
    loading.id = 'app-loading';
    loading.className = 'fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-50';
    loading.innerHTML = `
        <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">Loading QR Studio...</p>
            <p class="text-xs text-gray-500 mt-2">Connecting to dependencies...</p>
        </div>
    `;
    document.body.appendChild(loading);
    
    // Update loading status
    const updateLoadingStatus = (message) => {
        const statusEl = loading.querySelector('p:last-child');
        if (statusEl) statusEl.textContent = message;
    };
    
    // Test internet connectivity first
    updateLoadingStatus('Checking internet connection...');
    
    // Wait for dependencies and initialize
    loadDependencies()
        .then(() => {
            console.log('✅ All dependencies loaded successfully');
            updateLoadingStatus('Initializing application...');
            
            try {
                new QRStudio();
                console.log('✅ QR Studio initialized successfully');
                
                // Remove loading indicator
                setTimeout(() => {
                    loading.remove();
                }, 500);
            } catch (initError) {
                console.error('❌ Failed to initialize QR Studio:', initError);
                throw initError;
            }
        })
        .catch((error) => {
            console.error('❌ Failed to load dependencies:', error);
            
            let errorMessage = 'Failed to load QR Studio';
            let troubleshooting = '';
            
            if (error.message.includes('QRCode library')) {
                errorMessage = 'Cannot connect to required services';
                troubleshooting = 'Please check your internet connection and try again.';
            } else if (error.message.includes('network')) {
                errorMessage = 'Network connection issue';
                troubleshooting = 'Please check your internet connection.';
            }
            
            loading.innerHTML = `
                <div class="text-center max-w-md mx-auto p-6">
                    <div class="text-yellow-500 text-6xl mb-4">⚠️</div>
                    <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">${errorMessage}</h2>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">${troubleshooting}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-500 mb-6">Error: ${error.message}</p>
                    
                    <div class="space-y-3">
                        <button onclick="window.location.reload()" class="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-redo mr-2"></i>Retry Loading
                        </button>
                        
                        <button onclick="toggleDebugInfo()" class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                            <i class="fas fa-bug mr-2"></i>Show Debug Info
                        </button>
                    </div>
                    
                    <div id="debug-info" class="hidden mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
                        <h3 class="font-semibold mb-2">Debug Information:</h3>
                        <div class="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>User Agent: ${navigator.userAgent}</div>
                            <div>URL: ${window.location.href}</div>
                            <div>Protocol: ${window.location.protocol}</div>
                            <div>Host: ${window.location.host}</div>
                            <div>Online: ${navigator.onLine}</div>
                            <div>Time: ${new Date().toISOString()}</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Add debug toggle function
            window.toggleDebugInfo = () => {
                const debugInfo = document.getElementById('debug-info');
                if (debugInfo) {
                    debugInfo.classList.toggle('hidden');
                }
            };
        });
    
    // Add timeout as fallback
    setTimeout(() => {
        if (document.getElementById('app-loading')) {
            console.warn('⚠️ Loading timeout - forcing error state');
            const loading = document.getElementById('app-loading');
            if (loading && loading.innerHTML.includes('Loading QR Studio')) {
                loading.innerHTML = `
                    <div class="text-center">
                        <div class="text-yellow-500 text-4xl mb-4">⏱️</div>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">Loading is taking longer than expected</p>
                        <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                            Refresh Page
                        </button>
                    </div>
                `;
            }
        }
    }, 15000); // 15 second timeout
});

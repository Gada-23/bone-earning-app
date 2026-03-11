// script.js - Complete Bone Earning App Logic

class BoneEarningApp {
    constructor() {
        // Initialize properties
        this.tg = null;
        this.userId = null;
        this.isTelegramEnvironment = false;
        this.balance = 0;
        this.totalEarned = 0;
        this.referralCount = 0;
        this.dailyStreak = 0;
        this.lastClaimDate = null;
        
        // DOM Elements
        this.balanceAmount = document.getElementById('balanceAmount');
        this.progressBar = document.getElementById('progressBar');
        this.progressText = document.getElementById('progressText');
        this.totalEarnedEl = document.getElementById('totalEarned');
        this.referralCountEl = document.getElementById('referralCount');
        this.dailyStreakEl = document.getElementById('dailyStreak');
        this.referralLink = document.getElementById('referralLink');
        this.toast = document.getElementById('toast');
        
        // Buttons
        this.watchAdBtn = document.getElementById('watchAdBtn');
        this.withdrawBtn = document.getElementById('withdrawBtn');
        this.refreshBtn = document.getElementById('refreshBtn');
        this.copyLinkBtn = document.getElementById('copyLinkBtn');
        
        // Navigation
        this.navHome = document.getElementById('navHome');
        this.navEarn = document.getElementById('navEarn');
        this.navStats = document.getElementById('navStats');
        this.navProfile = document.getElementById('navProfile');
        
        // Check if essential elements exist
        if (!this.balanceAmount) {
            console.error('Critical elements missing!');
            return;
        }
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        try {
            // Check Telegram environment
            this.checkTelegramEnvironment();
            
            // Load user data
            await this.loadUserData();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI
            this.updateUI();
            
            // Check daily streak
            this.checkDailyStreak();
            
            // Set up referral link
            this.setupReferralLink();
            
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showToast('Failed to initialize app', 'error');
        }
    }
    
    checkTelegramEnvironment() {
        try {
            if (window.Telegram && window.Telegram.WebApp) {
                this.tg = window.Telegram.WebApp;
                this.isTelegramEnvironment = true;
                
                // Initialize Telegram WebApp
                this.tg.ready();
                this.tg.expand();
                
                // Get user info
                if (this.tg.initDataUnsafe && this.tg.initDataUnsafe.user) {
                    this.userId = this.tg.initDataUnsafe.user.id;
                    console.log('Telegram user:', this.userId);
                    
                    // Set main button if needed
                    this.tg.MainButton.setText('Watch Ad');
                    this.tg.MainButton.hide();
                }
                
                // Handle back button
                this.tg.BackButton.onClick(() => {
                    this.showToast('Back button pressed', 'info');
                });
            } else {
                console.log('Running in browser mode');
                // Set test user ID for development
                this.userId = 'test_user_123';
            }
        } catch (error) {
            console.log('Telegram check error:', error);
            // Fallback to browser mode
            this.userId = 'test_user_123';
        }
    }
    
    async loadUserData() {
        // In production, this would fetch from your backend
        // For now, use localStorage
        
        const storageKey = this.userId ? `boneApp_${this.userId}` : 'boneApp_dev';
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.balance = data.balance || 0;
                this.totalEarned = data.totalEarned || 0;
                this.referralCount = data.referralCount || 0;
                this.dailyStreak = data.dailyStreak || 0;
                this.lastClaimDate = data.lastClaimDate || null;
            } catch (e) {
                console.error('Failed to load saved data');
            }
        }
    }
    
    saveUserData() {
        const storageKey = this.userId ? `boneApp_${this.userId}` : 'boneApp_dev';
        const data = {
            balance: this.balance,
            totalEarned: this.totalEarned,
            referralCount: this.referralCount,
            dailyStreak: this.dailyStreak,
            lastClaimDate: this.lastClaimDate,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    
    setupEventListeners() {
        // Watch Ad Button
        this.watchAdBtn.addEventListener('click', () => this.handleWatchAd());
        
        // Withdraw Button
        this.withdrawBtn.addEventListener('click', () => this.handleWithdraw());
        
        // Refresh Button
        this.refreshBtn.addEventListener('click', () => this.handleRefresh());
        
        // Copy Link Button
        if (this.copyLinkBtn) {
            this.copyLinkBtn.addEventListener('click', () => this.handleCopyLink());
        }
        
        // Navigation
        if (this.navHome) {
            this.navHome.addEventListener('click', () => this.switchTab('home'));
            this.navEarn.addEventListener('click', () => this.switchTab('earn'));
            this.navStats.addEventListener('click', () => this.switchTab('stats'));
            this.navProfile.addEventListener('click', () => this.switchTab('profile'));
        }
    }
    
    async handleWatchAd() {
        try {
            // Disable button during ad
            this.watchAdBtn.disabled = true;
            this.watchAdBtn.innerHTML = '<span class="loading"></span> Loading Ad...';
            
            // Simulate ad loading
            await this.delay(1000);
            
            // Show ad (simulated)
            const adWatched = await this.showAd();
            
            if (adWatched) {
                // Add bones
                this.balance += 1;
                this.totalEarned += 1;
                
                // Check daily streak
                this.updateDailyStreak();
                
                // Save data
                this.saveUserData();
                
                // Update UI
                this.updateUI();
                
                // Show success message
                this.showToast('✅ You earned 1 bone!', 'success');
                
                // Trigger haptic feedback if in Telegram
                if (this.tg && this.tg.HapticFeedback) {
                    this.tg.HapticFeedback.notificationOccurred('success');
                }
            }
            
        } catch (error) {
            console.error('Ad watch error:', error);
            this.showToast('Failed to load ad', 'error');
        } finally {
            // Re-enable button
            this.watchAdBtn.disabled = false;
            this.watchAdBtn.innerHTML = '<span class="btn-icon">📺</span><span class="btn-text">Watch Ad & Earn 1 Bone</span>';
        }
    }
    
    async showAd() {
        // Simulate ad display
        return new Promise((resolve) => {
            this.showToast('📺 Watching ad...', 'info');
            
            setTimeout(() => {
                // 90% chance of successful ad completion
                const success = Math.random() < 0.9;
                
                if (success) {
                    this.showToast('✅ Ad completed!', 'success');
                } else {
                    this.showToast('❌ Ad failed, try again', 'error');
                }
                
                resolve(success);
            }, 2000);
        });
    }
    
    handleWithdraw() {
        const minimumWithdrawal = 1000;
        
        if (this.balance >= minimumWithdrawal) {
            // Calculate withdrawal amounts
            const withdrawalAmount = Math.floor(this.balance / 1000) * 1000;
            const remainingBones = this.balance - withdrawalAmount;
            
            // Show withdrawal dialog
            const message = 
                `💰 Withdrawal Request\n\n` +
                `Available: ${this.balance} bones\n` +
                `Withdraw: ${withdrawalAmount} bones\n` +
                `Remaining: ${remainingBones} bones\n\n` +
                `Confirm withdrawal?`;
            
            if (confirm(message)) {
                // Process withdrawal
                this.balance = remainingBones;
                this.saveUserData();
                this.updateUI();
                
                this.showToast(`✅ Withdrawal of ${withdrawalAmount} bones requested!`, 'success');
                
                // In production, this would call your backend
                console.log('Withdrawal requested:', withdrawalAmount);
            }
        } else {
            const needed = minimumWithdrawal - this.balance;
            this.showToast(`❌ Need ${needed} more bones to withdraw`, 'error');
            
            // Shake animation for insufficient balance
            this.balanceAmount.parentElement.classList.add('shake');
            setTimeout(() => {
                this.balanceAmount.parentElement.classList.remove('shake');
            }, 500);
        }
    }
    
    handleRefresh() {
        this.loadUserData();
        this.updateUI();
        this.showToast('🔄 Balance refreshed', 'success');
    }
    
    async handleCopyLink() {
        if (this.referralLink) {
            try {
                await navigator.clipboard.writeText(this.referralLink.value);
                this.showToast('📋 Referral link copied!', 'success');
                
                // Simulate referral (for testing)
                if (this.copyLinkBtn.textContent === 'Copy') {
                    this.copyLinkBtn.textContent = 'Copied!';
                    setTimeout(() => {
                        this.copyLinkBtn.textContent = 'Copy';
                    }, 2000);
                }
            } catch (err) {
                this.showToast('Failed to copy', 'error');
            }
        }
    }
    
    switchTab(tab) {
        // Update navigation active state
        const navItems = [this.navHome, this.navEarn, this.navStats, this.navProfile];
        navItems.forEach(item => item.classList.remove('active'));
        
        switch(tab) {
            case 'home':
                this.navHome.classList.add('active');
                this.showToast('🏠 Home', 'info');
                break;
            case 'earn':
                this.navEarn.classList.add('active');
                this.showToast('💰 Earn bones by watching ads!', 'info');
                break;
            case 'stats':
                this.navStats.classList.add('active');
                this.showStats();
                break;
            case 'profile':
                this.navProfile.classList.add('active');
                this.showProfile();
                break;
        }
    }
    
    showStats() {
        const stats = 
            `📊 Your Statistics\n\n` +
            `Total Earned: ${this.totalEarned} bones\n` +
            `Current Balance: ${this.balance} bones\n` +
            `Referrals: ${this.referralCount}\n` +
            `Daily Streak: ${this.dailyStreak} days\n` +
            `Withdrawals: ${Math.floor(this.totalEarned / 1000)}`;
        
        this.showToast(stats, 'info');
    }
    
    showProfile() {
        const userInfo = this.tg?.initDataUnsafe?.user;
        
        if (userInfo && this.isTelegramEnvironment) {
            const profile = 
                `👤 User Profile\n\n` +
                `Name: ${userInfo.first_name || ''} ${userInfo.last_name || ''}\n` +
                `Username: @${userInfo.username || 'N/A'}\n` +
                `User ID: ${userInfo.id}\n` +
                `Language: ${userInfo.language_code || 'en'}`;
            
            this.showToast(profile, 'info');
        } else {
            this.showToast('👤 Guest User (Development Mode)', 'info');
        }
    }
    
    updateUI() {
        // Update balance
        this.balanceAmount.textContent = this.balance;
        
        // Update progress bar
        const progress = (this.balance / 1000) * 100;
        this.progressBar.style.width = `${Math.min(progress, 100)}%`;
        
        // Update progress text
        const remaining = Math.max(0, 1000 - this.balance);
        this.progressText.textContent = `${remaining} more bones to withdraw`;
        
        // Update stats
        if (this.totalEarnedEl) {
            this.totalEarnedEl.textContent = `${this.totalEarned} 🦴`;
        }
        
        if (this.referralCountEl) {
            this.referralCountEl.textContent = this.referralCount;
        }
        
        if (this.dailyStreakEl) {
            this.dailyStreakEl.textContent = `${this.dailyStreak} day${this.dailyStreak !== 1 ? 's' : ''}`;
        }
        
        // Update main button if in Telegram
        if (this.tg && this.isTelegramEnvironment) {
            if (this.balance >= 1000) {
                this.tg.MainButton.setText('💰 Withdraw Now');
                this.tg.MainButton.show();
                this.tg.MainButton.onClick(() => this.handleWithdraw());
            } else {
                this.tg.MainButton.hide();
            }
        }
    }
    
    updateDailyStreak() {
        const today = new Date().toDateString();
        
        if (!this.lastClaimDate) {
            // First claim
            this.dailyStreak = 1;
        } else if (this.lastClaimDate === today) {
            // Already claimed today
            return;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (this.lastClaimDate === yesterday.toDateString()) {
                // Consecutive day
                this.dailyStreak++;
            } else {
                // Streak broken
                this.dailyStreak = 1;
            }
        }
        
        this.lastClaimDate = today;
        
        // Bonus for streak milestones
        if (this.dailyStreak === 7) {
            this.balance += 10;
            this.showToast('🎉 7-day streak! +10 bonus bones!', 'success');
        } else if (this.dailyStreak === 30) {
            this.balance += 50;
            this.showToast('🔥 30-day streak! +50 bonus bones!', 'success');
        }
    }
    
    checkDailyStreak() {
        const today = new Date().toDateString();
        
        if (this.lastClaimDate && this.lastClaimDate !== today) {
            const lastDate = new Date(this.lastClaimDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() !== yesterday.toDateString()) {
                // Missed a day
                this.dailyStreak = 0;
                this.showToast('⚠️ Streak reset - watch an ad to start again!', 'warning');
                this.saveUserData();
            }
        }
    }
    
    setupReferralLink() {
        if (this.referralLink) {
            const baseUrl = 'https://t.me/';
            const botUsername = this.tg?.initDataUnsafe?.user?.username || 'YourBot';
            const refCode = this.userId || 'ref123';
            
            this.referralLink.value = `${baseUrl}${botUsername}?start=${refCode}`;
        }
    }
    
    showToast(message, type = 'info') {
        if (!this.toast) return;
        
        this.toast.textContent = message;
        this.toast.className = 'toast show';
        
        // Add type class
        if (type === 'error') {
            this.toast.classList.add('error');
        } else if (type === 'success') {
            this.toast.classList.add('success');
        }
        
        // Hide after 3 seconds
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add shake animation CSS
    const style = document.createElement('style');
    style.textContent = `
        .shake {
            animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        
        @keyframes shake {
            10%, 90% { transform: translateX(-1px); }
            20%, 80% { transform: translateX(2px); }
            30%, 50%, 70% { transform: translateX(-4px); }
            40%, 60% { transform: translateX(4px); }
        }
    `;
    document.head.appendChild(style);
    
    // Start the app
    window.app = new BoneEarningApp();
});
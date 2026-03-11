// Bone Earning App - Complete Working Version

// Wait for the page to fully load
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Bone Earning App started');
    
    // ===========================================
    // TELEGRAM INTEGRATION
    // ===========================================
    
    // Check if we're running inside Telegram
    let tg = null;
    let userId = null;
    let isTelegramEnvironment = false;
    
    try {
        // Check if Telegram WebApp is available
        if (window.Telegram && window.Telegram.WebApp) {
            tg = window.Telegram.WebApp;
            isTelegramEnvironment = true;
            
            // Tell Telegram our app is ready
            tg.ready();
            
            // Expand to full height
            tg.expand();
            
            // Get user info if available
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                userId = tg.initDataUnsafe.user.id;
                console.log('Telegram user detected:', userId);
            } else {
                console.log('Telegram user not available');
            }
            
            console.log('Running inside Telegram');
        } else {
            console.log('Running outside Telegram (development mode)');
        }
    } catch (error) {
        console.log('Telegram integration error:', error);
        console.log('Continuing in development mode');
    }
    
    // ===========================================
    // VARIABLES
    // ===========================================
    
    // Get DOM elements
    const balanceAmount = document.getElementById('balanceAmount');
    const watchAdBtn = document.getElementById('watchAdBtn');
    const withdrawBtn = document.getElementById('withdrawBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    
    // Check if elements exist
    if (!balanceAmount || !watchAdBtn || !withdrawBtn || !refreshBtn) {
        console.error('❌ Error: Could not find all required HTML elements');
        console.log('balanceAmount:', balanceAmount);
        console.log('watchAdBtn:', watchAdBtn);
        console.log('withdrawBtn:', withdrawBtn);
        console.log('refreshBtn:', refreshBtn);
        return; // Stop execution if elements are missing
    }
    
    // ===========================================
    // HELPER FUNCTIONS
    // ===========================================
    
    /**
     * Show a message to the user
     */
    function showMessage(message, isError = false) {
        // Try to use Telegram's popup if available
        if (tg && isTelegramEnvironment) {
            try {
                tg.showPopup({
                    title: isError ? 'Error' : 'Success',
                    message: message,
                    buttons: [{ type: 'ok' }]
                });
                return;
            } catch (e) {
                // Fall back to alert if popup fails
            }
        }
        
        // Fallback to browser alert
        alert(message);
    }
    
    /**
     * Get current user balance
     */
    function getBalance() {
        let balance = 0;
        
        if (isTelegramEnvironment && userId) {
            // In Telegram mode, we'll eventually get from server
            // For now, use localStorage with user-specific key
            const storageKey = `boneBalance_${userId}`;
            balance = localStorage.getItem(storageKey);
        } else {
            // Development mode - use generic key
            balance = localStorage.getItem('boneBalance_dev');
        }
        
        // If no balance found, start at 0
        if (balance === null) {
            balance = 0;
        } else {
            balance = parseInt(balance);
        }
        
        return balance;
    }
    
    /**
     * Save user balance
     */
    function saveBalance(balance) {
        if (isTelegramEnvironment && userId) {
            // In Telegram mode, use user-specific key
            const storageKey = `boneBalance_${userId}`;
            localStorage.setItem(storageKey, balance.toString());
        } else {
            // Development mode
            localStorage.setItem('boneBalance_dev', balance.toString());
        }
    }
    
    /**
     * Update the displayed balance
     */
    function updateDisplayBalance() {
        const balance = getBalance();
        balanceAmount.textContent = balance;
        console.log('Balance updated:', balance);
    }
    
    // ===========================================
    // INITIALIZATION
    // ===========================================
    
    // Load and display initial balance
    updateDisplayBalance();
    console.log('Initial balance loaded');
    
    // ===========================================
    // EVENT HANDLERS
    // ===========================================
    
    /**
     * Handle Watch Ad button click
     */
    watchAdBtn.addEventListener('click', function() {
        console.log('👆 Watch Ad button clicked');
        
        // Get current balance
        let currentBalance = getBalance();
        console.log('Current balance:', currentBalance);
        
        // Simulate ad watching
        showMessage('Loading ad... (simulated)');
        
        // Simulate ad completion after 1 second
        setTimeout(() => {
            // Add 1 bone
            let newBalance = currentBalance + 1;
            
            // Save new balance
            saveBalance(newBalance);
            
            // Update display
            balanceAmount.textContent = newBalance;
            
            // Show success message
            showMessage(`✅ You earned 1 bone!\nNew balance: ${newBalance} bones`);
            
            console.log('Bone added. New balance:', newBalance);
        }, 1000);
    });
    
    /**
     * Handle Withdraw button click
     */
    withdrawBtn.addEventListener('click', function() {
        console.log('👆 Withdraw button clicked');
        
        const balance = getBalance();
        const minimumWithdrawal = 1000;
        
        if (balance >= minimumWithdrawal) {
            // Eligible for withdrawal
            showMessage(
                `💰 Withdrawal Request\n\n` +
                `Your balance: ${balance} bones\n` +
                `Minimum: ${minimumWithdrawal} bones\n\n` +
                `✅ You are eligible to withdraw!\n\n` +
                `We'll process your request soon.`
            );
            
            console.log('Withdrawal eligible:', balance);
        } else {
            // Not eligible
            const needed = minimumWithdrawal - balance;
            showMessage(
                `❌ Cannot Withdraw\n\n` +
                `Your balance: ${balance} bones\n` +
                `Minimum required: ${minimumWithdrawal} bones\n\n` +
                `You need ${needed} more bones to withdraw.`,
                true // This is an error message
            );
            
            console.log('Withdrawal not eligible. Need', needed, 'more bones');
        }
    });
    
    /**
     * Handle Refresh button click
     */
    refreshBtn.addEventListener('click', function() {
        console.log('👆 Refresh button clicked');
        
        // Reload balance from storage
        updateDisplayBalance();
        
        // Show confirmation
        const balance = getBalance();
        showMessage(`🔄 Balance refreshed\n\nCurrent balance: ${balance} bones`);
        
        console.log('Balance refreshed:', balance);
    });
    
    /**
     * Handle keyboard shortcuts for testing (development only)
     */
    document.addEventListener('keydown', function(event) {
        // Press 'a' to simulate adding 10 bones (for testing)
        if (event.key === 'a' && event.ctrlKey) {
            event.preventDefault();
            console.log('🔧 Dev mode: Adding 10 test bones');
            
            let balance = getBalance();
            balance += 10;
            saveBalance(balance);
            updateDisplayBalance();
            showMessage(`🔧 Dev: Added 10 test bones\nNew balance: ${balance}`);
        }
        
        // Press 'r' to reset balance (for testing)
        if (event.key === 'r' && event.ctrlKey) {
            event.preventDefault();
            console.log('🔧 Dev mode: Resetting balance');
            
            saveBalance(0);
            updateDisplayBalance();
            showMessage(`🔧 Dev: Balance reset to 0`);
        }
    });
    
    // ===========================================
    // ENVIRONMENT INFO (for debugging)
    // ===========================================
    
    console.log('📱 Environment:', isTelegramEnvironment ? 'Telegram' : 'Browser');
    console.log('🆔 User ID:', userId || 'Not logged in');
    console.log('💰 Initial balance:', getBalance());
    console.log('✅ App ready!');
});

// Export for testing (not needed for browser, but helpful)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {}; // For Node.js environment
}
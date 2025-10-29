// Reala Pro - Professional Real Estate Agent Suite JavaScript

// Global application state
const AppState = {
    currentPage: 'buying',
    clients: [],
    properties: [],
    calculations: {}
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    loadClients();
    generateProperties();
    updateNavigation();
});

// Application initialization
function initializeApp() {
    console.log('🏠 Reala Pro - Professional Real Estate Agent Suite');
    console.log('📊 Initialized on:', new Date().toLocaleDateString());
    
    // Set up event listeners
    setupEventListeners();
    
    // Load saved data
    loadSavedData();
    
    // Initialize calculator defaults
    initializeCalculators();
    
    // Setup mobile navigation
    setupMobileNavigation();
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    const buyForm = document.getElementById('buy-form');
    const sellForm = document.getElementById('sell-form');
    const clientForm = document.getElementById('client-form');
    
    if (buyForm) {
        buyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateBuy();
        });
    }
    
    if (sellForm) {
        sellForm.addEventListener('submit', function(e) {
            e.preventDefault();
            calculateSell();
        });
    }
    
    if (clientForm) {
        clientForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveClient();
        });
    }
    
    // Input validation and live calculations
    setupLiveCalculations();
    
    // Copy to clipboard functionality
    setupClipboardFunctions();
}

// Page navigation
function showPage(pageId) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page-content');
    allPages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Update navigation
    updateNavigation(pageId);
    
    // Update state
    AppState.currentPage = pageId;
    
    // Save to localStorage
    localStorage.setItem('reala_current_page', pageId);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`📄 Navigated to ${pageId} page`);
}

// Update navigation active states
function updateNavigation(activePage = 'buying') {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.textContent.toLowerCase().includes(activePage) || 
            (activePage === 'buying' && link.textContent.includes('Buying')) ||
            (activePage === 'selling' && link.textContent.includes('Selling')) ||
            (activePage === 'client-center' && link.textContent.includes('Client')) ||
            (activePage === 'agent-assistant' && link.textContent.includes('Agent'))) {
            link.classList.add('active');
        }
    });
}

// Mortgage calculation functions
function calculateMortgage(principal, rate, years) {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    
    if (monthlyRate === 0) {
        return principal / numberOfPayments;
    }
    
    const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return monthlyPayment;
}

function calculateTotalInterest(principal, monthlyPayment, years) {
    const totalPayments = monthlyPayment * years * 12;
    return totalPayments - principal;
}

function calculateEquityGrowth(principal, downPayment, rate, years, appreciationRate = 3) {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    
    // Calculate remaining principal after specified years
    let remainingPrincipal = principal;
    const monthlyPayment = calculateMortgage(principal, rate, 30);
    
    for (let i = 0; i < numberOfPayments; i++) {
        const interestPayment = remainingPrincipal * monthlyRate;
        const principalPayment = monthlyPayment - interestPayment;
        remainingPrincipal -= principalPayment;
    }
    
    // Calculate home value after appreciation
    const futureValue = principal * Math.pow(1 + appreciationRate / 100, years);
    const equity = futureValue - remainingPrincipal;
    
    return {
        equity: equity,
        remainingPrincipal: remainingPrincipal,
        futureValue: futureValue,
        principalPaid: principal - remainingPrincipal,
        appreciation: futureValue - principal
    };
}

// Buy analysis calculation
function calculateBuy() {
    try {
        // Get form values
        const currentRent = parseFloat(document.getElementById('current-rent').value) || 0;
        const targetPrice = parseFloat(document.getElementById('target-home-price').value) || 0;
        const downPayment = parseFloat(document.getElementById('down-payment-buy').value) || 0;
        const interestRate = parseFloat(document.getElementById('interest-rate-buy').value) || 0;
        const loanTerm = parseInt(document.getElementById('loan-term-buy').value) || 30;
        
        // Validation
        if (!targetPrice || !downPayment || !interestRate) {
            alert('Please fill in all required fields for the buying analysis.');
            return;
        }
        
        // Calculate loan amount
        const loanAmount = targetPrice - downPayment;
        
        if (loanAmount <= 0) {
            alert('Down payment cannot be equal to or greater than the home price.');
            return;
        }
        
        // Calculate monthly mortgage payment
        const monthlyMortgage = calculateMortgage(loanAmount, interestRate, loanTerm);
        
        // Calculate total interest
        const totalInterest = calculateTotalInterest(loanAmount, monthlyMortgage, loanTerm);
        
        // Calculate 5-year equity growth
        const equityData = calculateEquityGrowth(targetPrice, downPayment, interestRate, 5);
        
        // Calculate monthly savings compared to rent
        const monthlySavings = currentRent - monthlyMortgage;
        
        // Update display
        document.getElementById('monthly-mortgage').textContent = formatCurrency(monthlyMortgage);
        document.getElementById('loan-amount-buy').textContent = formatCurrency(loanAmount);
        document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
        document.getElementById('equity-5yr').textContent = formatCurrency(equityData.equity);
        document.getElementById('monthly-savings').textContent = formatCurrency(Math.abs(monthlySavings));
        
        // Update investment reason
        updateInvestmentReason(currentRent, monthlyMortgage, equityData.equity, targetPrice);
        
        // Update property recommendations
        updatePropertyRecommendations(targetPrice);
        
        // Store calculation data
        AppState.calculations.buy = {
            currentRent,
            targetPrice,
            downPayment,
            interestRate,
            loanTerm,
            monthlyMortgage,
            loanAmount,
            totalInterest,
            equity5Years: equityData.equity,
            monthlySavings
        };
        
        console.log('💰 Buy calculation completed:', AppState.calculations.buy);
        
    } catch (error) {
        console.error('❌ Error in buy calculation:', error);
        alert('There was an error calculating the buy analysis. Please check your inputs.');
    }
}

// Update investment reason text
function updateInvestmentReason(currentRent, monthlyMortgage, equity5Years, homePrice) {
    const reasonElement = document.getElementById('investment-reason');
    
    const monthlyDifference = currentRent - monthlyMortgage;
    const totalRentPaid = currentRent * 60; // 5 years
    const totalMortgagePaid = monthlyMortgage * 60; // 5 years
    const totalSavings = totalRentPaid - totalMortgagePaid;
    
    const fiveYearBenefit = equity5Years + totalSavings;
    const roi = (fiveYearBenefit / (homePrice * 0.2)) * 100; // Assuming 20% down
    
    reasonElement.innerHTML = `
        <strong>🏆 Your 5-Year Wealth Building Breakdown:</strong><br><br>
        
        <strong>💸 Money Saved vs. Renting:</strong> ${formatCurrency(totalSavings)} over 5 years<br>
        <strong>🏠 Equity Built:</strong> ${formatCurrency(equity5Years)} in your home<br>
        <strong>📈 Total Wealth Created:</strong> <span style="color: var(--success-green); font-weight: bold;">${formatCurrency(fiveYearBenefit)}</span><br>
        <strong>🚀 Return on Investment:</strong> <span style="color: var(--success-green); font-weight: bold;">${roi.toFixed(1)}%</span><br><br>
        
        <strong>💎 Why This is Powerful:</strong><br>
        • Your equity grows automatically while you live there<br>
        • Every payment builds wealth in YOUR pocket<br>
        • Tax benefits reduce your effective cost<br>
        • Fixed payment protects against inflation<br>
        • Rent money becomes building wealth money
    `;
}

// Sell analysis calculation
function calculateSell() {
    try {
        // Get form values
        const originalPrice = parseFloat(document.getElementById('original-price').value) || 0;
        const amountOwed = parseFloat(document.getElementById('amount-owed').value) || 0;
        const currentValue = parseFloat(document.getElementById('current-value').value) || 0;
        const desiredDownPayment = parseFloat(document.getElementById('desired-down-payment').value) || 0;
        const targetZip = document.getElementById('target-zip').value || '90210';
        
        // Validation
        if (!originalPrice || !amountOwed || !currentValue || !desiredDownPayment) {
            alert('Please fill in all required fields for the selling analysis.');
            return;
        }
        
        // Calculate current equity
        const currentEquity = currentValue - amountOwed;
        
        if (currentEquity <= 0) {
            alert('You do not have positive equity in your current home.');
            return;
        }
        
        // Calculate available for down payment (with selling costs)
        const sellingCosts = currentValue * 0.06; // 6% selling costs
        const availableForDownPayment = currentEquity - sellingCosts;
        
        if (availableForDownPayment <= 0) {
            alert('Selling costs would exceed your available equity.');
            return;
        }
        
        // Calculate maximum home price with 5% down
        const maxHomePrice = (desiredDownPayment / 0.05);
        const newLoanAmount = maxHomePrice - desiredDownPayment;
        
        // Estimate new mortgage payment (assuming 7.5% rate)
        const estimatedNewMortgage = calculateMortgage(newLoanAmount, 7.5, 30);
        
        // Update display
        document.getElementById('current-equity').textContent = formatCurrency(currentEquity);
        document.getElementById('available-down-payment').textContent = formatCurrency(availableForDownPayment);
        document.getElementById('max-home-price').textContent = formatCurrency(maxHomePrice);
        document.getElementById('new-mortgage').textContent = formatCurrency(estimatedNewMortgage);
        
        // Update next home analysis
        updateNextHomeAnalysis(currentEquity, availableForDownPayment, maxHomePrice, targetZip);
        
        // Update property recommendations
        updateSellPropertyRecommendations(maxHomePrice, targetZip);
        
        // Store calculation data
        AppState.calculations.sell = {
            originalPrice,
            amountOwed,
            currentValue,
            currentEquity,
            sellingCosts,
            availableForDownPayment,
            desiredDownPayment,
            maxHomePrice,
            newLoanAmount,
            estimatedNewMortgage,
            targetZip
        };
        
        console.log('💰 Sell calculation completed:', AppState.calculations.sell);
        
    } catch (error) {
        console.error('❌ Error in sell calculation:', error);
        alert('There was an error calculating the selling analysis. Please check your inputs.');
    }
}

// Update next home analysis text
function updateNextHomeAnalysis(currentEquity, availableDownPayment, maxHomePrice, zipCode) {
    const analysisElement = document.getElementById('next-home-analysis');
    
    const equityGained = currentEquity;
    const buyingPower = maxHomePrice;
    const downPaymentPercent = ((availableDownPayment / maxHomePrice) * 100).toFixed(1);
    
    analysisElement.innerHTML = `
        <strong>🎯 Your Next Home Buying Power:</strong><br><br>
        
        <strong>💰 Equity to Invest:</strong> ${formatCurrency(equityGained)}<br>
        <strong>🏡 Buying Power:</strong> ${formatCurrency(buyingPower)} home<br>
        <strong>📊 Down Payment Percentage:</strong> ${downPaymentPercent}%<br>
        <strong>📍 Target Area:</strong> ${zipCode}<br><br>
        
        <strong>🚀 Your Wealth Building Advantage:</strong><br>
        • Your current equity becomes your next home's down payment<br>
        • You can buy a significantly larger home with your equity<br>
        • Each upgrade builds even more wealth for future moves<br>
        • This equity will continue growing in your new home<br>
        • You're not starting over - you're leveling up!
    `;
}

// Generate mock property data
function generateProperties() {
    AppState.properties = [
        {
            id: 1,
            price: 485000,
            location: "Austin, TX",
            beds: 4,
            baths: 3,
            sqft: 2400,
            type: "Modern Family Home",
            zipCode: "78701"
        },
        {
            id: 2,
            price: 625000,
            location: "Seattle, WA", 
            beds: 2,
            baths: 2,
            sqft: 1200,
            type: "Downtown Condo",
            zipCode: "98101"
        },
        {
            id: 3,
            price: 445000,
            location: "Phoenix, AZ",
            beds: 3,
            baths: 2,
            sqft: 1800,
            type: "Suburban Ranch",
            zipCode: "85001"
        },
        {
            id: 4,
            price: 750000,
            location: "Austin, TX",
            beds: 5,
            baths: 4,
            sqft: 3200,
            type: "Luxury Estate",
            zipCode: "78702"
        },
        {
            id: 5,
            price: 350000,
            location: "Phoenix, AZ",
            beds: 3,
            baths: 2,
            sqft: 1600,
            type: "Starter Home",
            zipCode: "85002"
        },
        {
            id: 6,
            price: 550000,
            location: "Seattle, WA",
            beds: 3,
            baths: 2.5,
            sqft: 2100,
            type: "Contemporary Home",
            zipCode: "98102"
        },
        {
            id: 7,
            price: 825000,
            location: "Austin, TX",
            beds: 4,
            baths: 3.5,
            sqft: 2800,
            type: "Premium Modern",
            zipCode: "78703"
        },
        {
            id: 8,
            price: 395000,
            location: "Phoenix, AZ",
            beds: 4,
            baths: 2,
            sqft: 1950,
            type: "Family Home",
            zipCode: "85003"
        },
        {
            id: 9,
            price: 675000,
            location: "Seattle, WA",
            beds: 3,
            baths: 3,
            sqft: 2300,
            type: "Luxury Condo",
            zipCode: "98103"
        }
    ];
}

// Update property recommendations for buying
function updatePropertyRecommendations(targetPrice) {
    const container = document.getElementById('buy-properties');
    if (!container) return;
    
    // Filter properties within 20% of target price
    const minPrice = targetPrice * 0.8;
    const maxPrice = targetPrice * 1.2;
    
    const recommendations = AppState.properties.filter(property => 
        property.price >= minPrice && property.price <= maxPrice
    ).slice(0, 6); // Show max 6 properties
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="professional-card" style="text-align: center;">
                <p style="color: var(--neutral-600); font-size: 18px;">
                    🏠 No properties found in your price range.<br>
                    Try adjusting your target home price to see recommendations.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(property => `
        <div class="property-card" onclick="viewProperty(${property.id})">
            <div class="property-image">
                🏠
            </div>
            <div class="property-content">
                <div class="property-price">${formatCurrency(property.price)}</div>
                <div class="property-details">
                    <strong>${property.type}</strong><br>
                    ${property.location} ${property.zipCode}
                </div>
                <div class="property-features">
                    <span class="feature-tag">${property.beds} bed</span>
                    <span class="feature-tag">${property.baths} bath</span>
                    <span class="feature-tag">${property.sqft.toLocaleString()} sq ft</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Update property recommendations for selling
function updateSellPropertyRecommendations(maxPrice, zipCode) {
    const container = document.getElementById('sell-properties');
    if (!container) return;
    
    // Filter properties within budget and similar area
    const similarZipCodes = getSimilarZipCodes(zipCode);
    
    const recommendations = AppState.properties.filter(property => 
        property.price <= maxPrice && similarZipCodes.includes(property.zipCode)
    ).slice(0, 6); // Show max 6 properties
    
    if (recommendations.length === 0) {
        container.innerHTML = `
            <div class="professional-card" style="text-align: center;">
                <p style="color: var(--neutral-600); font-size: 18px;">
                    🏡 No properties found in your buying power.<br>
                    Consider adjusting your desired down payment to see more options.
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendations.map(property => `
        <div class="property-card" onclick="viewProperty(${property.id})">
            <div class="property-image">
                🏡
            </div>
            <div class="property-content">
                <div class="property-price">${formatCurrency(property.price)}</div>
                <div class="property-details">
                    <strong>${property.type}</strong><br>
                    ${property.location} ${property.zipCode}
                </div>
                <div class="property-features">
                    <span class="feature-tag">${property.beds} bed</span>
                    <span class="feature-tag">${property.baths} bath</span>
                    <span class="feature-tag">${property.sqft.toLocaleString()} sq ft</span>
                </div>
                <div style="margin-top: 12px; color: var(--success-green); font-weight: 600;">
                    ✅ Within Your Budget
                </div>
            </div>
        </div>
    `).join('');
}

// Get similar zip codes (mock function)
function getSimilarZipCodes(zipCode) {
    const zipMap = {
        '90210': ['90210', '90211', '90212'],
        '78701': ['78701', '78702', '78703'],
        '98101': ['98101', '98102', '98103'],
        '85001': ['85001', '85002', '85003']
    };
    
    return zipMap[zipCode] || [zipCode];
}

// View property details
function viewProperty(propertyId) {
    const property = AppState.properties.find(p => p.id === propertyId);
    if (!property) return;
    
    alert(`🏠 ${property.type}\n\n` +
          `💰 Price: ${formatCurrency(property.price)}\n` +
          `📍 Location: ${property.location} ${property.zipCode}\n` +
          `🛏️ Bedrooms: ${property.beds}\n` +
          `🚿 Bathrooms: ${property.baths}\n` +
          `📐 Square Feet: ${property.sqft.toLocaleString()}\n\n` +
          `This is a demo property. In a real application, this would show detailed property information, photos, and allow scheduling showings.`);
}

// Client management functions
function saveClient() {
    try {
        // Get form values
        const client = {
            id: Date.now(),
            name: document.getElementById('client-name-full').value,
            phone: document.getElementById('client-phone-primary').value,
            email: document.getElementById('client-email-primary').value,
            address: document.getElementById('client-current-address').value,
            type: document.getElementById('client-type-main').value,
            priceRange: document.getElementById('client-price-range').value,
            timeline: document.getElementById('client-timeline').value,
            preferredLocations: document.getElementById('client-preferred-locations').value,
            mustHaves: document.getElementById('client-must-haves').value,
            notes: document.getElementById('client-notes').value,
            createdAt: new Date().toISOString()
        };
        
        // Validation
        if (!client.name || !client.phone || !client.email || !client.type) {
            alert('Please fill in all required fields (Name, Phone, Email, Client Type).');
            return;
        }
        
        // Add to clients array
        AppState.clients.push(client);
        
        // Save to localStorage
        saveClients();
        
        // Update display
        updateClientsList();
        
        // Clear form
        document.getElementById('client-form').reset();
        
        // Show success message
        showSuccessMessage('Client profile saved successfully!');
        
        console.log('👥 Client saved:', client);
        
    } catch (error) {
        console.error('❌ Error saving client:', error);
        alert('There was an error saving the client profile. Please try again.');
    }
}

function updateClientsList() {
    const container = document.getElementById('clients-list-portfolio');
    if (!container) return;
    
    if (AppState.clients.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; color: var(--neutral-600); padding: 60px 20px;">
                <div style="font-size: 48px; margin-bottom: 20px;">📋</div>
                <h3 style="margin-bottom: 12px;">No clients yet</h3>
                <p>Create your first client profile to start building your client portfolio!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = AppState.clients.map(client => `
        <div class="client-item" onclick="viewClientDetails(${client.id})">
            <div class="client-name">${client.name}</div>
            <div class="client-details">
                <strong>Type:</strong> ${formatClientType(client.type)}<br>
                <strong>Price Range:</strong> ${client.priceRange || 'Not specified'}<br>
                <strong>Timeline:</strong> ${formatTimeline(client.timeline)}<br>
                <strong>Added:</strong> ${new Date(client.createdAt).toLocaleDateString()}<br>
                ${client.phone ? `<strong>Phone:</strong> ${client.phone}<br>` : ''}
                ${client.preferredLocations ? `<strong>Preferred Areas:</strong> ${client.preferredLocations}` : ''}
            </div>
        </div>
    `).join('');
}

function viewClientDetails(clientId) {
    const client = AppState.clients.find(c => c.id === clientId);
    if (!client) return;
    
    const details = `
👥 CLIENT PROFILE
━━━━━━━━━━━━━━━━━━━━━━━━

👤 Name: ${client.name}
📞 Phone: ${client.phone}
📧 Email: ${client.email}
📍 Current Address: ${client.address || 'Not provided'}

🏡 CLIENT TYPE: ${formatClientType(client.type)}
💰 PRICE RANGE: ${client.priceRange || 'Not specified'}
⏰ TIMELINE: ${formatTimeline(client.timeline)}

📍 PREFERRED LOCATIONS:
${client.preferredLocations || 'Not specified'}

🏠 MUST-HAVE FEATURES:
${client.mustHaves || 'Not specified'}

📝 ADDITIONAL NOTES:
${client.notes || 'No additional notes'}

━━━━━━━━━━━━━━━━━━━━━━━━
Created: ${new Date(client.createdAt).toLocaleDateString()}
    `;
    
    alert(details);
}

function formatClientType(type) {
    const types = {
        'first-time-buyer': 'First-Time Buyer',
        'move-up-buyer': 'Move-Up Buyer',
        'downsize-seller': 'Downsize Seller',
        'investor': 'Investor',
        'relocation': 'Relocation'
    };
    return types[type] || type;
}

function formatTimeline(timeline) {
    const timelines = {
        'immediate': 'Immediate (0-3 months)',
        'short-term': 'Short-term (3-6 months)',
        'medium-term': 'Medium-term (6-12 months)',
        'long-term': 'Long-term (12+ months)'
    };
    return timelines[timeline] || timeline;
}

// Script copying functions
function copyScript(scriptType) {
    const scripts = {
        'buyer-consultation': "Thank you for taking the time to meet with me today. I'm excited to help you find your dream home and build wealth through real estate. As we go through this process, I'll make sure you understand exactly how buying a home is one of the smartest financial decisions you can make. We're not just looking for a house - we're building your investment portfolio and securing your family's future. Let me show you why renting is just throwing money away, but owning builds wealth that lasts generations.",
        
        'mortgage-explanation': "Here's what most people don't understand about mortgages: Your monthly payment stays exactly the same for 30 years, but your income typically goes up. That means you're paying 'less' every year in real terms. Plus, every payment you make builds equity - that's money in your pocket, not your landlord's. Unlike rent, which increases every year, your mortgage payment is locked in. And the best part? The government gives you a huge tax deduction on mortgage interest - that's money back in your pocket.",
        
        'investment-growth': "Let me show you the math that will change your life. If you buy a $450,000 home with 20% down, you'll have $90,000 in equity immediately. Even if your home only appreciates 3% per year (below historical average), in 5 years you'll have over $150,000 in equity. Meanwhile, if you're renting and paying $2,500/month, you'll have paid $150,000 to someone else with nothing to show for it. That's a $300,000 difference! Your home is the only investment where the bank finances 80% of it and you get 100% of the appreciation.",
        
        'seller-motivation': "I can see you have significant equity in your home - that's fantastic! This equity isn't just sitting there; it's your ticket to your next level of living. Whether you want to upgrade to your dream home, downsize for simplicity, or invest in multiple properties, that equity gives you options most people don't have. The real estate market is moving fast, and buyers are ready to pay premium prices. Let's capture this equity now while the market is hot and position you for your next chapter.",
        
        'next-home-power': "Based on your current equity, you have serious buying power for your next home. We're talking about putting $100,000 down on a $2 million property instead of starting from scratch. That's the power of building equity - it compounds your wealth and opens doors you never thought possible. Most people work their entire lives and never build this kind of wealth. Your home equity is your secret weapon for creating generational wealth.",
        
        'deal-closing': "Here's what I need you to understand: Every day you wait is money out of your pocket. Real estate prices increase, interest rates could rise, and that perfect home you love might be gone tomorrow. But here's what won't change - my commitment to getting you the best deal and making this process as smooth as possible. I've helped hundreds of families just like yours, and I can tell you with certainty: the best time to buy was yesterday, and the second-best time is today. Are you ready to start building wealth instead of just paying someone else's mortgage?",
        
        'urgency-creation': "The market moves at lightning speed right now. Good homes are selling within days, often above asking price. I've seen clients miss out on their dream home because they wanted to 'think about it' for a week. Don't let that be you. The difference between acting now and waiting could cost you tens of thousands of dollars in appreciation and equity. I'm not trying to pressure you - I'm trying to protect your financial future. Are you ready to secure your family's financial foundation?",
        
        'value-proposition': "Let me tell you what makes me different from other agents. I don't just help you buy and sell houses - I build your wealth through real estate. Every client I work with becomes part of my investment family. I don't disappear after the sale; I'm your real estate advisor for life. When you're ready to upgrade, downsize, or invest, I'm here. When your friends need an agent, I hope you'll refer them to me. This isn't a transaction - it's the beginning of a long-term relationship that will benefit your family for generations."
    };
    
    const scriptText = scripts[scriptType];
    if (!scriptText) return;
    
    navigator.clipboard.writeText(scriptText).then(() => {
        showSuccessMessage('Script copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy script: ', err);
        alert('Script: ' + scriptText);
    });
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function showSuccessMessage(message) {
    // Create and show success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-green);
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
        z-index: 10000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Data persistence
function saveClients() {
    localStorage.setItem('reala_clients', JSON.stringify(AppState.clients));
}

function loadClients() {
    const saved = localStorage.getItem('reala_clients');
    if (saved) {
        AppState.clients = JSON.parse(saved);
        updateClientsList();
    }
}

function loadSavedData() {
    // Load current page
    const savedPage = localStorage.getItem('reala_current_page');
    if (savedPage) {
        showPage(savedPage);
    }
    
    // Load saved calculations
    const savedCalculations = localStorage.getItem('reala_calculations');
    if (savedCalculations) {
        AppState.calculations = JSON.parse(savedCalculations);
    }
}

// Setup live calculations
function setupLiveCalculations() {
    // Add input event listeners for real-time calculations
    const inputs = document.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            if (input.closest('#buy-form')) {
                // Auto-calculate buy if all required fields are filled
                const requiredFields = ['current-rent', 'target-home-price', 'down-payment-buy', 'interest-rate-buy'];
                if (requiredFields.every(id => document.getElementById(id)?.value)) {
                    calculateBuy();
                }
            } else if (input.closest('#sell-form')) {
                // Auto-calculate sell if all required fields are filled
                const requiredFields = ['original-price', 'amount-owed', 'current-value', 'desired-down-payment'];
                if (requiredFields.every(id => document.getElementById(id)?.value)) {
                    calculateSell();
                }
            }
        }, 500));
    });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Mobile navigation setup
function setupMobileNavigation() {
    // Create mobile menu toggle if needed
    const nav = document.querySelector('.nav-menu');
    if (window.innerWidth <= 768 && nav) {
        // Mobile navigation is handled by CSS
    }
}

// Initialize calculators with default values
function initializeCalculators() {
    // Set default values for demonstration
    const buyDefaults = {
        'current-rent': 2500,
        'target-home-price': 450000,
        'down-payment-buy': 90000,
        'interest-rate-buy': 7.5
    };
    
    const sellDefaults = {
        'original-price': 350000,
        'amount-owed': 250000,
        'current-value': 425000,
        'desired-down-payment': 100000
    };
    
    // Apply defaults
    Object.entries(buyDefaults).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && !element.value) {
            element.value = value;
        }
    });
    
    Object.entries(sellDefaults).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element && !element.value) {
            element.value = value;
        }
    });
}

// Setup clipboard functions
function setupClipboardFunctions() {
    // Ensure clipboard API is available
    if (!navigator.clipboard) {
        console.warn('Clipboard API not available');
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.showPage = showPage;
window.calculateBuy = calculateBuy;
window.calculateSell = calculateSell;
window.saveClient = saveClient;
window.copyScript = copyScript;
window.viewProperty = viewProperty;
window.viewClientDetails = viewClientDetails;

console.log('🚀 Reala Pro JavaScript loaded successfully!');
import puppeteer from 'puppeteer';
import fs from 'fs';

const baseUrl = 'https://www.namshi.com/uae-en/women/search/?q=cap&selected_gender=women';

// Delimiter condition - you can customize this
const MAX_PAGES = 10; // Default max pages as safety measure
const PRODUCTS_PER_PAGE_THRESHOLD = 3; // If fewer products found, consider it a delimiter
const NAV_DELAY_MS = 3000; // Delay between page navigations (3 seconds)

// Helper function for introducing a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const scrapeAllPages = async (maxPages = MAX_PAGES, productsThreshold = PRODUCTS_PER_PAGE_THRESHOLD) => {
    // Added 'args' for a more stealthy puppeteer launch
    const browser = await puppeteer.launch({ 
        headless: false,
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox'
        ]
    });
    const page = await browser.newPage();
    
    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    let currentPage = 1;
    let hasNextPage = true;
    let allProducts = [];
    
    console.log(`Starting scraping...`);
    
    try {
        while (hasNextPage && currentPage <= maxPages) {
            const pageUrl = `${baseUrl}&page=${currentPage}`;
            console.log(`Scraping page ${currentPage}: ${pageUrl}`);
            
            // Wait for a few seconds before navigating to the next page to avoid bot detection
            if (currentPage > 1) {
                console.log(`Waiting for ${NAV_DELAY_MS / 1000} seconds before next navigation...`);
                await delay(NAV_DELAY_MS);
            }
            
            // Increased timeout for page navigation
            await page.goto(pageUrl, { 
                waitUntil: 'networkidle2',
                timeout: 60000 // 60 seconds timeout
            });
            
            // Attempt to close a common cookie/privacy pop-up
            // NOTE: You must inspect the page to find the actual selector for the cookie button
            await page.evaluate(() => {
                // Common selectors for Namshi or similar sites (customize if needed)
                const acceptButton = document.querySelector('#onetrust-accept-btn-handler') || 
                                     document.querySelector('.cookie-consent-button');
                if (acceptButton) {
                    acceptButton.click();
                    console.log('Clicked cookie accept button.');
                }
            }).catch(e => console.log('No visible cookie banner found or click failed.'));


            try {
                // Wait for product selector to appear
                await page.waitForSelector('.ProductBox_container__wiajf', { timeout: 10000 });
            } catch (error) {
                console.log(`No products found on page ${currentPage} within timeout. Reached the end or selector changed.`);
                break;
            }
            
            const pageProducts = await scrapeProductsFromPage(page);
            console.log(`Found ${pageProducts.length} products on page ${currentPage}`);
            
            // Add products from this page to our collection
            allProducts = [...allProducts, ...pageProducts];
            
            // Check if we've reached our delimiter condition (few or no products)
            if (pageProducts.length < productsThreshold) {
                console.log(`Reached delimiter condition: only ${pageProducts.length} products found (threshold: ${productsThreshold})`);
                hasNextPage = false;
            } else {
                currentPage++;
            }
        }
    } catch (error) {
        console.error('Error during pagination scraping:', error);
        // Ensure browser is closed even on error
        if (browser) await browser.close();
        throw error; // Re-throw the error to be caught by main
    } finally {
        if (browser) await browser.close();
    }
    
    return allProducts;
};

const scrapeProductsFromPage = async (page) => {
    return await page.evaluate(() => {
        const cleanImageUrl = (url) => url.replace(/\?.*$/, '');
        const productElements = document.querySelectorAll('.ProductBox_container__wiajf.ProductBox_boxContainer__p7PaQ');
        
        if (productElements.length === 0) {
            console.error('No product elements found on this page.');
            return [];
        }
        
        const productArray = [];
        productElements.forEach((element) => {
            const brand = element.querySelector('.ProductBox_brand__oDc9f')?.textContent.trim() || '';
            const simpleName = element.querySelector('.ProductBox_productTitle__6tQ3b')?.textContent.trim() || '';
            const name = `${brand} ${simpleName}`;

            // Get images
            const images = Array.from(
                new Set(
                    Array.from(element.querySelectorAll('.ProductImage_imageContainer__B5pcR img'))
                        .map(img => img.getAttribute('src'))
                        .filter(src => src)
                        .map(src => cleanImageUrl(src))
                )
            );

            // Extract price information
            const currencyElement = element.querySelector('.ProductPrice_currency__issmK');
            const valueElement = element.querySelector('.ProductPrice_value__hnFSS');
            const currency = currencyElement?.textContent.trim() || '';
            const value = valueElement?.textContent.trim() || '0';
            
            // Get original price
            const originalPriceElement = element.querySelector('.ProductPrice_preReductionPrice__S72wT');
            const originalPrice = originalPriceElement?.textContent.trim() || '0';
            
            // Extract discount percentage
            const discountElement = element.querySelector('.DiscountTag_value__D52x5');
            const discount = discountElement?.textContent.trim() || '';

            const price = parseFloat(value.replace(/,/g, '')); // Clean and parse price
            const originalPriceValue = parseFloat(originalPrice.replace(/,/g, ''));

            const rating = Math.floor(Math.random() * 5) + 2;
            const quantity = Math.floor(Math.random() * 300) + 1;
            const sizeList = ['S', 'M', 'L', 'XL', 'XXL'];
            const sizes = sizeList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''); // Improved slug
            const shipping = Math.random() < 0.5 ? 'Paid Shipping' : 'Free Shipping';
            const colorList = ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray', 'black', 'white'];
            const colors = colorList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
            
            productArray.push({
                name,
                description: `Stay Warm, Stay Stylish
Discover the best of outerwear with our exclusive collection from Adidas and Nike. Whether you're braving the cold or adding an edge to your everyday look, our selection of jackets has got you covered.`,
                price: price,
                original_price: originalPriceValue,
                discount: discount,
                currency: currency,
                rating,
                sizes,
                quantity,
                cover_img: images[0],
                prev_imgs: images.join('@'),
                category_id: 3,
                slug,
                shipping,
                colors,
            });
        });

        return productArray;
    });
};

// **The postProductsToAPI function is REMOVED as requested.**

const main = async () => {
    try {
        // Configuration for single page test
        const maxPages = 1;  // Testing one page as requested
        const productsThreshold = 1; 
        
        console.log(`Starting pagination scraping (max ${maxPages} pages, threshold ${productsThreshold} products)`);
        
        // Scrape all products from multiple pages
        const allProducts = await scrapeAllPages(maxPages, productsThreshold);
        
        // Save all products to a single JSON file
        fs.writeFileSync('products.json', JSON.stringify(allProducts, null, 2));
        console.log(`Data successfully written to products.json (${allProducts.length} total products)`);
        
        // **API posting step is REMOVED as requested.**
        
        // Optional: Return the data
        return allProducts; 
        
    } catch (error) {
        console.error('Error during main scraping process:', error);
    }
};

main();
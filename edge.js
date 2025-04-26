const fs = require('fs'); // <-- Import the fs module
const path = require('path'); // <-- Import the path module

const contentTypes = {
    "text/html": "html htm shtml",
    "text/css": "css",
    "text/xml": "xml",
    "image/gif": "gif",
    "image/jpeg": "jpeg jpg",
    "application/x-javascript": "js", // Note: application/javascript is more standard
    "application/javascript": "js",    // Added for completeness
    "application/atom+xml": "atom",
    "application/rss+xml": "rss",
    "text/mathml": "mml",
    "text/plain": "txt",
    "text/vnd.sun.j2me.app-descriptor": "jad",
    "text/vnd.wap.wml": "wml",
    "text/x-component": "htc",
    "image/png": "png",
    "image/tiff": "tif tiff",
    "image/vnd.wap.wbmp": "wbmp",
    "image/x-icon": "ico",
    "image/x-jng": "jng",
    "image/x-ms-bmp": "bmp",
    "image/svg+xml": "svg",
    "image/webp": "webp",
    "application/java-archive": "jar war ear",
    "application/mac-binhex40": "hqx",
    "application/msword": "doc",
    "application/pdf": "pdf",
    "application/postscript": "ps eps ai",
    "application/rtf": "rtf",
    "application/vnd.ms-excel": "xls",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.wap.wmlc": "wmlc",
    "application/vnd.google-earth.kml+xml": "kml",
    "application/vnd.google-earth.kmz": "kmz",
    "application/x-7z-compressed": "7z",
    "application/x-cocoa": "cco",
    "application/x-java-archive-diff": "jardiff",
    "application/x-java-jnlp-file": "jnlp",
    "application/x-makeself": "run",
    "application/x-perl": "pl pm",
    "application/x-pilot": "prc pdb",
    "application/x-rar-compressed": "rar",
    "application/x-redhat-package-manager": "rpm",
    "application/x-sea": "sea",
    "application/x-shockwave-flash": "swf",
    "application/x-stuffit": "sit",
    "application/x-tcl": "tcl tk",
    "application/x-x509-ca-cert": "der pem crt",
    "application/x-xpinstall": "xpi",
    "application/xhtml+xml": "xhtml",
    "application/zip": "zip",
    "application/octet-stream": "bin exe dll deb dmg eot iso img msi msp msm",
    "audio/midi": "mid midi kar",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/x-realaudio": "ra",
    "video/3gpp": "3gpp 3gp",
    "video/mpeg": "mpeg mpg",
    "video/quicktime": "mov",
    "video/x-flv": "flv",
    "video/x-mng": "mng",
    "video/x-ms-asf": "asx asf",
    "video/x-ms-wmv": "wmv",
    "video/x-msvideo": "avi",
    "video/mp4": "m4v mp4"
};

// Consider optimizing this lookup if performance becomes an issue
// (e.g., create a reverse map extension -> contentType)
const getContentTypes = (filePath) => {
    // path.extname returns '.ext', so slice(1) removes the dot
	const ext = path.extname(filePath).slice(1).toLowerCase();

	if (!ext) {
	    return "text/plain"; // Default if no extension
	}

	for(const contentType in contentTypes) {
        // Split the extensions string into an array and check if the file's extension is included
		if(contentTypes[contentType].split(' ').includes(ext)) {
			return contentType;
		}
	}

	// Default if extension not found in map
	return "application/octet-stream"; // Or text/plain, depending on desired default
}


module.exports = async (context) => {
	let urlPath = context.req.path;
  // Ensure index.html is served for root requests
    context.log(urlPath)
    urlPath = urlPath === '/' ? 'index.html' : urlPath;
    context.log(urlPath)
    // Basic check to prevent path traversal, although robust sanitization is better
    if (urlPath.includes('..')) {
        return context.res.send('Invalid path', 400, { 'content-type': 'text/plain' });
    }

    // Use path.join for safer path construction
    let filePath = path.join(__dirname, 'build', urlPath);
    context.log(filePath)
    try {
        // Use fs.promises for async/await style if preferred and supported
        // Check if file exists BEFORE trying to read it
        if (!fs.existsSync(filePath)) {
            // Handle file not found - maybe return a 404 or fall back to SSR/SPA routing
            // throw new Error("Requested path doesn't exist! " + filePath); // Throwing will likely cause a 500
             return context.res.send('Not Found', 404, { 'content-type': 'text/plain' });
            // return await ssrLogic(context); // If you have fallback logic
        }

        // Check if the resolved path points to a directory (optional, depends on desired behavior)
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
             // Decide how to handle directory requests (e.g., deny, serve index.html if exists, etc.)
             // For now, let's treat it like not found
             return context.res.send('Not Found (directory access forbidden)', 404, { 'content-type': 'text/plain' });
        }

        const fileContent = fs.readFileSync(filePath);
        const contentType = getContentTypes(filePath);

        return context.res.send(fileContent, 200, { 'content-type': contentType });

    } catch (error) {
        // Log the error for debugging
        console.error("Error serving static file:", error);

        // Return a generic 500 error to the client
        // Avoid leaking detailed error information (like file paths) in production
        return context.res.send('Internal Server Error', 500, { 'content-type': 'text/plain' });
    }
};
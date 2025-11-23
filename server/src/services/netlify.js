// const axios = require('axios');
// const FormData = require('form-data');
// const archiver = require('archiver');
// const { Readable } = require('stream');

// const NETLIFY_API_TOKEN = process.env.NETLIFY_API_TOKEN;
// const NETLIFY_API_BASE = 'https://api.netlify.com/api/v1';

// /**
//  * Create a ZIP file from file structure
//  */
// function createZipFromFiles(files) {
//   return new Promise((resolve, reject) => {
//     const archive = archiver('zip', {
//       zlib: { level: 9 } // Maximum compression
//     });

//     const chunks = [];
    
//     archive.on('data', (chunk) => {
//       chunks.push(chunk);
//     });

//     archive.on('end', () => {
//       const buffer = Buffer.concat(chunks);
//       resolve(buffer);
//     });

//     archive.on('error', (err) => {
//       reject(err);
//     });

//     // Add files to archive
//     files.forEach((file) => {
//       let filePath = file.path || file.name;
//       // Remove "project/" prefix if present (Netlify expects files at root)
//       filePath = filePath.replace(/^project\//, '');
//       const fileContent = file.content || '';
//       archive.append(fileContent, { name: filePath });
//     });

//     archive.finalize();
//   });
// }

// /**
//  * Deploy files to Netlify
//  */
// async function deployToNetlify(files, siteName = null) {
//   if (!NETLIFY_API_TOKEN) {
//     throw new Error('NETLIFY_API_TOKEN is not set in environment variables');
//   }

//   try {
//     let siteId;
//     let siteUrl;

//     // Step 1: Create or get site
//     if (siteName) {
//       // Try to find existing site first
//       try {
//         const sitesResponse = await axios.get(`${NETLIFY_API_BASE}/sites`, {
//           headers: {
//             'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         const existingSite = sitesResponse.data.find(site => site.name === siteName);
//         if (existingSite) {
//           siteId = existingSite.id;
//           siteUrl = existingSite.ssl_url || existingSite.url;
//         }
//       } catch (error) {
//         console.log('Could not find existing site, will create new one');
//       }
//     }

//     // Create new site if not found
//     if (!siteId) {
//       const siteData = {
//         name: siteName || `vibecode-${Date.now()}`,
//         custom_domain: null
//       };

//       const createResponse = await axios.post(
//         `${NETLIFY_API_BASE}/sites`,
//         siteData,
//         {
//           headers: {
//             'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );

//       siteId = createResponse.data.id;
//       siteUrl = createResponse.data.ssl_url || createResponse.data.url;
//     }

//     // Step 2: Create ZIP file from all files
//     console.log('Creating ZIP file from', files.length, 'files...');
//     const zipBuffer = await createZipFromFiles(files);
//     console.log('ZIP file created, size:', zipBuffer.length, 'bytes');

//     // Step 3: Create deploy with state "uploading" first
//     console.log('Creating deploy with uploading state...');
//     const deployCreateResponse = await axios.post(
//       `${NETLIFY_API_BASE}/sites/${siteId}/deploys`,
//       {
//         state: 'uploading'
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     const deployId = deployCreateResponse.data.id;
//     console.log('Deploy created with ID:', deployId);

//     // Step 4: Upload ZIP file to the deploy
//     console.log('Uploading ZIP file to deploy...');
//     const formData = new FormData();
//     formData.append('file', zipBuffer, {
//       filename: 'deploy.zip',
//       contentType: 'application/zip'
//     });

//     try {
//       // Try uploading to the deploy_files endpoint
//       await axios.put(
//         `${NETLIFY_API_BASE}/deploys/${deployId}/files`,
//         formData,
//         {
//           headers: {
//             'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//             ...formData.getHeaders()
//           },
//           maxContentLength: Infinity,
//           maxBodyLength: Infinity,
//           timeout: 120000
//         }
//       );
//       console.log('ZIP file uploaded successfully');
//     } catch (uploadError) {
//       console.log('ZIP upload failed, trying alternative method...');
      
//       // Alternative: Upload files individually
//       console.log('Uploading files individually...');
//       const fileUploadPromises = files.map(async (file) => {
//         const filePath = file.path || file.name;
//         const fileContent = file.content || '';
        
//         // Remove leading "project/" if present
//         const cleanPath = filePath.replace(/^project\//, '');
//         const encodedPath = encodeURIComponent(cleanPath);

//         try {
//           await axios.put(
//             `${NETLIFY_API_BASE}/deploys/${deployId}/files/${encodedPath}`,
//             fileContent,
//             {
//               headers: {
//                 'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//                 'Content-Type': getContentType(filePath)
//               },
//               maxContentLength: Infinity,
//               maxBodyLength: Infinity
//             }
//           );
//           console.log(`✓ Uploaded: ${cleanPath}`);
//         } catch (error) {
//           console.error(`✗ Failed to upload ${cleanPath}:`, error.response?.data || error.message);
//           throw new Error(`Failed to upload ${cleanPath}: ${error.message}`);
//         }
//       });

//       await Promise.all(fileUploadPromises);
//       console.log('All files uploaded successfully');
//     }

//     // Step 5: Finalize the deploy (change state from uploading to ready)
//     console.log('Finalizing deploy...');
//     try {
//       await axios.put(
//         `${NETLIFY_API_BASE}/deploys/${deployId}`,
//         {
//           state: 'ready'
//         },
//         {
//           headers: {
//             'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );
//       console.log('Deploy finalized');
//     } catch (error) {
//       console.log('Finalize step:', error.response?.status === 404 ? 'Not needed' : error.message);
//     }

//     // Step 6: Publish deploy (make it live)
//     console.log('Publishing deploy...');
//     try {
//       await axios.post(
//         `${NETLIFY_API_BASE}/deploys/${deployId}/restore`,
//         {},
//         {
//           headers: {
//             'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//             'Content-Type': 'application/json'
//           }
//         }
//       );
//       console.log('Deployment published successfully');
//     } catch (error) {
//       // If restore fails, the deploy might already be published
//       if (error.response?.status === 404) {
//         console.log('Deploy already published or restore not needed');
//       } else {
//         console.log('Publish step error (may be OK):', error.message);
//       }
//     }

//     return {
//       success: true,
//       url: siteUrl,
//       siteId: siteId,
//       deployId: deployId
//     };

//   } catch (error) {
//     console.error('Netlify deployment error:', error.response?.data || error.message);
    
//     if (error.response) {
//       const errorData = error.response.data;
//       throw new Error(`Netlify API error: ${errorData?.message || error.message}`);
//     }
    
//     throw new Error(`Deployment failed: ${error.message}`);
//   }
// }

// /**
//  * Get content type based on file extension
//  */
// function getContentType(filePath) {
//   const ext = filePath.split('.').pop().toLowerCase();
//   const contentTypes = {
//     'html': 'text/html',
//     'js': 'application/javascript',
//     'jsx': 'application/javascript',
//     'css': 'text/css',
//     'json': 'application/json',
//     'png': 'image/png',
//     'jpg': 'image/jpeg',
//     'jpeg': 'image/jpeg',
//     'svg': 'image/svg+xml',
//     'gif': 'image/gif',
//     'ico': 'image/x-icon',
//     'txt': 'text/plain',
//     'md': 'text/markdown'
//   };
//   return contentTypes[ext] || 'text/plain';
// }

// /**
//  * Get site status
//  */
// async function getSiteStatus(siteId) {
//   if (!NETLIFY_API_TOKEN) {
//     throw new Error('NETLIFY_API_TOKEN is not set');
//   }

//   try {
//     const response = await axios.get(
//       `${NETLIFY_API_BASE}/sites/${siteId}`,
//       {
//         headers: {
//           'Authorization': `Bearer ${NETLIFY_API_TOKEN}`,
//           'Content-Type': 'application/json'
//         }
//       }
//     );

//     return {
//       url: response.data.ssl_url || response.data.url,
//       state: response.data.state,
//       published_deploy: response.data.published_deploy
//     };
//   } catch (error) {
//     throw new Error(`Failed to get site status: ${error.message}`);
//   }
// }

// module.exports = {
//   deployToNetlify,
//   getSiteStatus
// };


// server/src/services/netlify.js
// const axios = require('axios');
// const archiver = require('archiver');
// const { PassThrough } = require('stream');

/**
 * Create an in-memory ZIP buffer from files: [{ path, content }]
 */
// async function createZipBuffer(files) {
//   return new Promise((resolve, reject) => {
//     const archive = archiver('zip', { zlib: { level: 9 } });
//     const stream = new PassThrough();
//     const chunks = [];

//     stream.on('data', (chunk) => chunks.push(chunk));
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//     stream.on('error', reject);

//     archive.on('error', reject);

//     archive.pipe(stream);

//     for (const file of files) {
//       // Netlify expects forward-slash paths like "index.html", "src/App.jsx"
//       const filePath = file.path.replace(/^\//, '');
//       archive.append(file.content, { name: filePath });
//     }

//     archive.finalize();
//   });
// }

// async function createZipBuffer(files) {
//   return new Promise((resolve, reject) => {
//     const archive = archiver('zip', { zlib: { level: 9 } });
//     const stream = new PassThrough();
//     const chunks = [];

//     stream.on('data', (chunk) => chunks.push(chunk));
//     stream.on('end', () => resolve(Buffer.concat(chunks)));
//     stream.on('error', reject);

//     archive.on('error', reject);

//     archive.pipe(stream);

//     for (const file of files) {
//       let filePath = file.path || file.name || '';

//       // Remove leading slash and "project/" prefix if it somehow still exists
//       filePath = filePath.replace(/^\/+/, '').replace(/^project\//, '');

//       // ✅ IMPORTANT: move public/index.html to root as index.html
//       if (filePath === 'public/index.html') {
//         filePath = 'index.html';
//       } else if (filePath.startsWith('public/')) {
//         // for other assets in public/, drop the "public/" prefix
//         filePath = filePath.replace(/^public\//, '');
//       }

//       // Now filePath will be like:
//       // - index.html
//       // - favicon.ico
//       // - src/App.jsx
//       // etc.
//       archive.append(file.content, { name: filePath });
//       console.log('[zip] adding', filePath);
//     }

//     archive.finalize();
//   });
// }

// function getNetlifyClient() {
//   const token = process.env.NETLIFY_API_TOKEN; // 👈 make sure this is set in server/.env

//   if (!token) {
//     throw new Error('NETLIFY_API_TOKEN is not set in environment variables');
//   }

//   return axios.create({
//     baseURL: 'https://api.netlify.com/api/v1',
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'User-Agent': 'VibeCode-Netlify-Deployer',
//     },
//   });
// }

// /**
//  * Deploy files to Netlify and return { url, siteId, deployId }
//  * files: [{ path: 'src/App.jsx', content: '...' }, ...]
//  */
// async function deployToNetlify(files, siteName) {
//   const client = getNetlifyClient();

//   // 1) Make a valid Netlify site name
//   let sanitizedName = (siteName || `vibecode-${Date.now()}`)
//     .toLowerCase()
//     .replace(/[^a-z0-9-]/g, '-')
//     .replace(/-+/g, '-')
//     .replace(/^-|-$/g, '');

//   if (!sanitizedName) {
//     sanitizedName = `vibecode-${Date.now()}`;
//   }

//   console.log('Creating Netlify site with name:', sanitizedName);

//   // 2) Create site (you can later optimize to reuse an existing one)
//   const siteRes = await client.post('/sites', {
//     name: sanitizedName,
//   });

//   const site = siteRes.data;
//   const siteId = site.id;

//   console.log('Created Netlify site:', siteId, site.name);

//   // 3) Build ZIP from files
//   console.log(`Creating ZIP from ${files.length} files...`);
//   const zipBuffer = await createZipBuffer(files);
//   console.log('ZIP size:', zipBuffer.length, 'bytes');

//   // 4) Deploy ZIP in a single call (this both creates & uploads the deploy)
//   console.log('Uploading ZIP to Netlify (deploy)...');

//   const deployRes = await client.post(
//     `/sites/${siteId}/deploys`,
//     zipBuffer,
//     {
//       headers: {
//         'Content-Type': 'application/zip',
//       },
//       maxContentLength: Infinity,
//       maxBodyLength: Infinity,
//     }
//   );

//   const deploy = deployRes.data;

//   console.log('Deploy created:', {
//     deployId: deploy.id,
//     state: deploy.state,
//     url: deploy.url,
//     ssl_url: deploy.ssl_url,
//   });

//   // Netlify typically gives you .ssl_url (https) and .url
//   const liveUrl = deploy.ssl_url || deploy.url;

//   if (!liveUrl) {
//     throw new Error('Deploy created but no URL returned from Netlify');
//   }

//   return {
//     url: liveUrl,
//     siteId,
//     deployId: deploy.id,
//   };
// }

// /**
//  * Get site / latest deploy status by siteId
//  */
// async function getSiteStatus(siteId) {
//   const client = getNetlifyClient();

//   const res = await client.get(`/sites/${siteId}`);
//   const site = res.data;

//   // You can customize this as needed
//   return {
//     siteId: site.id,
//     name: site.name,
//     url: site.ssl_url || site.url,
//     state: site.state, // "current", etc.
//   };
// }

// module.exports = {
//   deployToNetlify,
//   getSiteStatus,
// };




// server/src/services/netlify.js
const axios = require('axios');
const archiver = require('archiver');
const { PassThrough } = require('stream');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

/**
 * Run a shell command in a directory
 */
function runCommand(cmd, cwd) {
  return new Promise((resolve, reject) => {
    const child = exec(cmd, { cwd }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout;
        err.stderr = stderr;
        return reject(err);
      }
      resolve({ stdout, stderr });
    });

    child.stdout?.on('data', (d) => process.stdout.write(d));
    child.stderr?.on('data', (d) => process.stderr.write(d));
  });
}

/**
 * Write the "files" from the API to a temporary project directory
 * files: [{ path, content }]
 */
async function writeFilesToTempProject(files) {
  const projectDir = path.join(
    os.tmpdir(),
    `vibecode-project-${Date.now()}-${Math.random().toString(16).slice(2)}`
  );

  for (const file of files) {
    if (!file.path) continue;
    let relPath = file.path.replace(/^\/+/, '').replace(/^project\//, '');
    const fullPath = path.join(projectDir, relPath);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, file.content ?? '', 'utf8');
  }

  return projectDir;
}

/**
 * Recursively collect files from a directory into [{ path, content }]
 */
async function collectBuiltFiles(rootDir) {
  const result = [];

  async function walk(currentDir) {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else {
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        const content = await fs.promises.readFile(fullPath);
        // Keep binary buffers as-is; Netlify accepts them
        result.push({ path: relPath, content });
      }
    }
  }

  await walk(rootDir);
  return result;
}

/**
 * Create an in-memory ZIP buffer from files: [{ path, content }]
 */
async function createZipBuffer(files) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    archive.on('error', reject);

    archive.pipe(stream);

    for (const file of files) {
      let filePath = (file.path || '').replace(/^\/+/, '');

      // here these are already built files (dist/build),
      // we just add them with their relative paths
      archive.append(file.content, { name: filePath });
      console.log('[zip] adding', filePath);
    }

    archive.finalize();
  });
}

function getNetlifyClient() {
  const token = process.env.NETLIFY_API_TOKEN;

  if (!token) {
    throw new Error('NETLIFY_API_TOKEN is not set in environment variables');
  }

  return axios.create({
    baseURL: 'https://api.netlify.com/api/v1',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'VibeCode-Netlify-Deployer',
    },
  });
}

/**
 * Deploy files to Netlify and return { url, siteId, deployId }
 * Incoming files are the *source* project. We will:
 *  - write them to a temp folder,
 *  - run npm install + npm run build,
 *  - collect the built assets from dist/ or build/,
 *  - zip and deploy those to Netlify.
 */
async function deployToNetlify(files, siteName) {
  // 1) Write source project to a temp dir
  const projectDir = await writeFilesToTempProject(files);
  console.log('[deploy] Project written to', projectDir);

  // 2) Ensure package.json with a build script exists
  const pkgPath = path.join(projectDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    throw new Error(
      'Cannot build project: package.json not found. ' +
      'Your generated project must include a package.json with a "build" script.'
    );
  }

  const pkgJson = JSON.parse(await fs.promises.readFile(pkgPath, 'utf8'));
  if (!pkgJson.scripts || !pkgJson.scripts.build) {
    throw new Error(
      'Cannot build project: package.json has no "build" script. ' +
      'Add something like "build": "vite build" or "react-scripts build".'
    );
  }

  // 3) Install dependencies
  console.log('[deploy] Running npm install...');
  await runCommand('npm install --omit=dev', projectDir)
    .catch(async (err) => {
      // if --omit=dev fails for some reason, fall back to plain npm install
      console.warn('[deploy] npm install --omit=dev failed, falling back to npm install');
      console.warn(err.stderr || err.message);
      await runCommand('npm install', projectDir);
    });

  // 4) Run build
  console.log('[deploy] Running npm run build...');
  try {
    await runCommand('npm run build', projectDir);
  } catch (err) {
    console.error('[deploy] Build failed:', err.stderr || err.message);
    throw new Error('Build failed. Check your build script and dependencies.');
  }

  // 5) Determine build output folder (dist for Vite, build for CRA)
  const distDir = path.join(projectDir, 'dist');
  const buildDir = path.join(projectDir, 'build');

  let outputDir = null;
  if (fs.existsSync(distDir)) {
    outputDir = distDir;
  } else if (fs.existsSync(buildDir)) {
    outputDir = buildDir;
  } else {
    throw new Error(
      'Build succeeded but no dist/ or build/ directory found. ' +
      'Make sure your build outputs to "dist" (Vite) or "build" (CRA).'
    );
  }

  console.log('[deploy] Collecting built files from', outputDir);
  const builtFiles = await collectBuiltFiles(outputDir);
  console.log('[deploy] Built file count:', builtFiles.length);

  // 6) Create Netlify site
  const client = getNetlifyClient();

  let sanitizedName = (siteName || `vibecode-${Date.now()}`)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!sanitizedName) {
    sanitizedName = `vibecode-${Date.now()}`;
  }

  console.log('Creating Netlify site with name:', sanitizedName);

  const siteRes = await client.post('/sites', { name: sanitizedName });
  const site = siteRes.data;
  const siteId = site.id;

  console.log('Created Netlify site:', siteId, site.name);

  // 7) Zip built files and deploy
  console.log(`Creating ZIP from ${builtFiles.length} built files...`);
  const zipBuffer = await createZipBuffer(builtFiles);
  console.log('ZIP size:', zipBuffer.length, 'bytes');

  console.log('Uploading ZIP to Netlify (deploy)...');
  const deployRes = await client.post(
    `/sites/${siteId}/deploys`,
    zipBuffer,
    {
      headers: {
        'Content-Type': 'application/zip',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }
  );

  const deploy = deployRes.data;

  console.log('Deploy created:', {
    deployId: deploy.id,
    state: deploy.state,
    url: deploy.url,
    ssl_url: deploy.ssl_url,
  });

  const liveUrl = deploy.ssl_url || deploy.url;
  if (!liveUrl) {
    throw new Error('Deploy created but no URL returned from Netlify');
  }

  return {
    url: liveUrl,
    siteId,
    deployId: deploy.id,
  };
}

/**
 * Get site / latest deploy status by siteId
 */
async function getSiteStatus(siteId) {
  const client = getNetlifyClient();

  const res = await client.get(`/sites/${siteId}`);
  const site = res.data;

  return {
    siteId: site.id,
    name: site.name,
    url: site.ssl_url || site.url,
    state: site.state,
  };
}

module.exports = {
  deployToNetlify,
  getSiteStatus,
};

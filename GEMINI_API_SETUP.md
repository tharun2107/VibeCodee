# Gemini API Setup Guide

## Why You're Getting Quota Errors

The error "You exceeded your current quota" can happen for several reasons:

### 1. **Wrong Model Name** ✅ FIXED
- The code was using `gemini-2.5-flash` which doesn't exist
- **Fixed**: Now using `gemini-1.5-flash` (correct model name)
- Available models:
  - `gemini-1.5-flash` - Fast, free tier friendly
  - `gemini-1.5-pro` - Better quality, may have higher costs

### 2. **Free Tier Rate Limits**
Google's free tier has rate limits:
- **Requests per minute (RPM)**: 15 requests/minute
- **Requests per day (RPD)**: 1,500 requests/day
- **Tokens per minute (TPM)**: 1,000,000 tokens/minute

### 3. **Billing Not Set Up**
Even for free tier, you need to:
1. Have a Google Cloud account
2. Enable billing (even if you stay within free tier)
3. Enable the Gemini API

## How to Fix

### Step 1: Verify Your API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create or copy your API key
3. Make sure it's enabled for Gemini API

### Step 2: Check Your Quota
1. Go to [Google Cloud Console - API Quotas](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Check your current usage
3. Verify rate limits

### Step 3: Set Up Billing (Required Even for Free Tier)
1. Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Link a billing account (you won't be charged if you stay within free tier)
3. Enable the Generative Language API

### Step 4: Update Your .env File
Make sure your `server/.env` file has:
```env
GEMINI_API_KEY=your_actual_api_key_here
GEMINI_MODEL=gemini-1.5-flash
PORT=5000
```

### Step 5: Restart Your Server
```bash
cd server
npm run dev
```

## Testing Your API Key

You can test your API key directly:

```bash
curl "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Say hello"
      }]
    }]
  }'
```

## Common Issues & Solutions

### Issue: "API key not valid"
**Solution**: 
- Regenerate your API key at https://aistudio.google.com/app/apikey
- Make sure you copied the entire key
- Restart your server after updating .env

### Issue: "Quota exceeded"
**Solutions**:
1. Wait a few minutes (rate limits reset)
2. Check your usage at https://ai.google.dev/usage
3. Switch to `gemini-1.5-flash` (lower cost)
4. Reduce `maxOutputTokens` in the code (currently 8192)

### Issue: "Billing not enabled"
**Solution**:
- Enable billing in Google Cloud Console
- You won't be charged if you stay within free tier limits

### Issue: "Model not found"
**Solution**:
- Use `gemini-1.5-flash` or `gemini-1.5-pro`
- Check available models at https://ai.google.dev/models

## Rate Limiting Tips

To avoid quota errors:

1. **Use Flash model** for faster, cheaper requests
2. **Add delays** between requests if making many calls
3. **Monitor usage** at https://ai.google.dev/usage
4. **Reduce token limits** if hitting TPM limits

## Updated Code Changes

The code has been updated to:
- ✅ Use correct model name (`gemini-1.5-flash`)
- ✅ Provide better error messages
- ✅ Map common model name variations
- ✅ Give helpful troubleshooting tips in errors

## Still Having Issues?

1. **Check API Status**: https://status.cloud.google.com/
2. **View API Documentation**: https://ai.google.dev/docs
3. **Check Rate Limits**: https://ai.google.dev/gemini-api/docs/rate-limits
4. **Contact Support**: https://support.google.com/cloud

## Free Tier Limits Summary

| Limit | Free Tier |
|-------|-----------|
| Requests per minute | 15 RPM |
| Requests per day | 1,500 RPD |
| Tokens per minute | 1,000,000 TPM |
| Cost | Free (within limits) |

**Note**: If you exceed free tier, you'll need to upgrade to a paid plan.


import { Request, Response } from 'express';
import Thumbnail from '../models/Thumbnail.js';

import { v2 as cloudinary } from 'cloudinary';

const stylePrompts = {
    'Bold & Graphic': 'eye-catching thumbnail, bold typography, vibrant colors, expressive facial reaction, dramatic lighting, high contrast, click-worthy composition, professional style',
    'Tech/Futuristic': 'futuristic thumbnail, sleek modern design, digital UI elements, glowing accents, holographic effects, cyber-tech aesthetic, sharp lighting, high-tech atmosphere',
    'Minimalist': 'minimalist thumbnail, clean layout, simple shapes, limited color palette, plenty of negative space, modern flat design, clear focal point',
    'Photorealistic': 'photorealistic thumbnail, ultra-realistic lighting, natural skin tones, candid moment, DSLR-style photography, lifestyle realism, shallow depth of field',
    'Illustrated': 'illustrated thumbnail, custom digital illustration, stylized characters, bold outlines, vibrant colors, creative cartoon or vector art style',
};

const colorSchemeDescriptions = {
    vibrant: 'vibrant and energetic colors, high saturation, bold contrasts, eye-catching palette',
    sunset: 'warm sunset tones, orange pink and purple hues, soft gradients, cinematic glow',
    forest: 'natural green tones, earthy colors, calm and organic palette, fresh atmosphere',
    neon: 'neon glow effects, electric blues and pinks, cyberpunk lighting, high contrast glow',
    purple: 'purple-dominant color palette, magenta and violet tones, modern and stylish mood',
    monochrome: 'black and white color scheme, high contrast, dramatic lighting, timeless aesthetic',
    ocean: 'cool blue and teal tones, aquatic color palette, fresh and clean atmosphere',
    pastel: 'soft pastel colors, low saturation, gentle tones, calm and friendly aesthetic',
};

export const generateThumbnail = async (req: Request, res: Response) => {
    try {
        const { userId, title, prompt: user_prompt, style, aspect_ratio, color_scheme, text_overlay } = req.body;
        const thumbnail = await Thumbnail.create({
            userId,
            title,
            prompt_used: user_prompt,
            user_prompt,
            style,
            aspect_ratio,
            color_scheme,
            text_overlay,
            isGenerating: true,
        });

        // Clean title to remove any user-inputted quotes that cause double-quoting in the prompt
        const cleanTitle = title.replace(/["']/g, '').trim();

        let prompt = `A professional YouTube thumbnail. `;

        if (text_overlay === true) {
            prompt += `The image prominently features the text "${cleanTitle.toUpperCase()}" written in massive, bold, highly readable letters. `;
        }

        prompt += `The subject is about: ${cleanTitle}. Style: ${stylePrompts[style as keyof typeof stylePrompts] || 'high-quality thumbnail'}. `;

        if (color_scheme) {
            prompt += `Color palette: ${colorSchemeDescriptions[color_scheme as keyof typeof colorSchemeDescriptions] || color_scheme}. `;
        }

        if (user_prompt) {
            prompt += `Additional details: ${user_prompt}. `;
        }

        let width = 1344;
        let height = 768;
        if (aspect_ratio === '1:1') {
            width = 1024;
            height = 1024;
        } else if (aspect_ratio === '9:16') {
            width = 768;
            height = 1344;
        }

        // Generate image using NVIDIA NIM API (stable-diffusion-3.5-large) via integrate endpoint
        const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "stabilityai/stable-diffusion-3.5-large",
                prompt,
                response_format: "b64_json",
                aspect_ratio: aspect_ratio === '1:1' ? '1:1' : aspect_ratio === '9:16' ? '9:16' : '16:9',
                cfg_scale: 4.5,
                steps: 28,
                seed: Math.floor(Math.random() * 1000000)
            }),
        });

        if (!nvidiaResponse.ok) {
            const errBody = await nvidiaResponse.text();
            throw new Error(`NVIDIA API error: ${errBody}`);
        }

        const data = await nvidiaResponse.json();

        let base64Image = '';
        if (data.artifacts && data.artifacts[0] && data.artifacts[0].base64) {
            base64Image = `data:image/png;base64,${data.artifacts[0].base64}`;
        } else if (data.image) {
            base64Image = `data:image/png;base64,${data.image}`;
        } else if (data.data && data.data[0] && data.data[0].b64_json) {
            base64Image = `data:image/png;base64,${data.data[0].b64_json}`;
        } else {
            console.error('Unexpected NVIDIA API response format:', data);
            throw new Error('Failed to get valid response from NVIDIA');
        }

        const uploadResult = await cloudinary.uploader.upload(base64Image, {
            resource_type: 'image',
            transformation: [
                { width: width, height: height, crop: "fill", gravity: "auto" }
            ]
        });

        thumbnail.image_url = uploadResult.secure_url;
        thumbnail.isGenerating = false;
        await thumbnail.save();

        res.json({ message: 'Thumbnail Generated', thumbnail });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Controllers For Thumbnail Deletion
export const deleteThumbnail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;

        await Thumbnail.findByIdAndDelete({ _id: id, userId });

        res.json({ message: 'Thumbnail deleted successfully' });
    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

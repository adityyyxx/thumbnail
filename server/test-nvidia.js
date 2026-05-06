import 'dotenv/config';

const checkNvidia = async () => {
    const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: "stabilityai/stable-diffusion-3.5-large",
            prompt: "A professional YouTube thumbnail.",
            response_format: "b64_json",
            aspect_ratio: '16:9',
            cfg_scale: 4.5,
            steps: 28,
            seed: 12345
        }),
    });

    if (!nvidiaResponse.ok) {
        const errBody = await nvidiaResponse.text();
        console.error(`NVIDIA API error: ${errBody}`);
    } else {
        console.log("Success!");
    }
}

checkNvidia();

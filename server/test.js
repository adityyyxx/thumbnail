import 'dotenv/config';

const testNvidia = async () => {
    try {
        console.log("Testing Stable Diffusion XL...");
        const res = await fetch('https://ai.api.nvidia.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: "stabilityai/stable-diffusion-xl-base-1.0",
                prompt: "a cat",
                size: "1024x1024",
                response_format: "b64_json"
            })
        });
        console.log(res.status, (await res.text()).substring(0, 200));
    } catch (e) {
        console.error(e);
    }
}
testNvidia();

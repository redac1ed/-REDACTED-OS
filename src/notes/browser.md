The browser is powered by **Kasm Workspaces** running in the background, consuming approximately **1,000 MB of RAM** and **0.75 CPU cores** per session.

To host this, I used a VPS allocated with about 12 GB of RAM and 6 CPU cores. Keep in mind, this setup will not work in your application if you simply drop it. Each browser tab is very resource-intensive, so I strongly recommend provisioning your own dedicated instance.

**Setup steps:**

1. **Install the Chrome image** inside the Kasm workspace.
2. **Configure a cast URL** to funnel all requests through a single endpoint. Make sure to enable anonymous access, since there is no user authentication or sign-in flow involved.
3. **Add the cast URL to your `.env` file** and all good.

If you run into any issues during setup, feel free to reach out!
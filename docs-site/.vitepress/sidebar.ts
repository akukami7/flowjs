export const sidebar = [
    {
        text: 'Getting Started',
        items: [
            { text: 'Quickstart', link: '/' },
        ]
    },
    {
        text: 'Core',
        collapsed: false,
        items: [
            { text: 'Routing', link: '/routing' },
            { text: 'Data Loading', link: '/data-loading' },
            { text: 'API Routes', link: '/api-routes' },
            { text: 'Middleware', link: '/middleware' }
        ]
    },
    {
        text: 'Production',
        collapsed: false,
        items: [
            { text: 'Deployment', link: '/deployment' },
            { text: 'Troubleshooting', link: '/troubleshooting' }
        ]
    }
];

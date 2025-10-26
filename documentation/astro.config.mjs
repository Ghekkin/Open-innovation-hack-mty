// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Ghekkin',
			customCss: [
				'/src/styles/custom.css'
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/Ghekkin/Open-innovation-hack-mty' }],
			sidebar: [
				{
					label: 'Documentación',
                    items: [
                        // Each item here is one entry in the navigation menu.
                        { label: 'Inicio Rápido', slug: 'documentation/01-getting-started' },
                        { label: 'El Proyecto', slug: 'documentation/02-vista-general' },
                        { label: 'Arquitectura', slug: 'documentation/03-arquitectura-bd' },
                        { label: 'Backend', slug: 'documentation/04-backend' },
                        { label: 'Frontend', slug: 'documentation/05-frontend' },
                        { label: 'Mejoras Futuras', slug: 'documentation/06-mejoras-futuras' },
                    ],
				},
			],
		}),
	],
	vite: {
		server: {
			host: true,
			allowedHosts: ['*']
		}
	},
	server: {
		host: true
	}
});

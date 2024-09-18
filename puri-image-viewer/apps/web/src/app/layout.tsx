import type { Metadata } from 'next';
import '@web/styles/globals.scss';

export const metadata: Metadata = {
	title: 'puri-image-viewer',
	description: 'for internship',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
    	<html lang="ja">
      		<body>
				{children}
      		</body>
    	</html>
  	);
}

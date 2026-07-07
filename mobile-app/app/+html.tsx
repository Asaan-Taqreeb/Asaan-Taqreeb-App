import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

// This file is rendered when the web app is built or served.
// It injects standard PWA meta links into the head of index.html.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* Link PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* iOS Meta Tags for Home Screen Installation */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Asaan Taqreeb" />
        <link rel="apple-touch-icon" href="/logo.png" />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
  html, body, #root {
    height: 100%;
  }

  body {
    background-color: #F8FAFC;
    margin: 0;
    overflow-x: hidden;
    overflow-y: auto;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
  }
  @media (prefers-color-scheme: dark) {
    body {
      background-color: #0F172A;
    }
  }
`;

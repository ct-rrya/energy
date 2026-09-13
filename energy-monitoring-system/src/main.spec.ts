import * as fs from 'fs';
import * as path from 'path';

/**
 * Unit Tests for main.ts Helmet Configuration
 * 
 * Task 8.2: Add Helmet.js security headers
 * Requirements: 8.11 - THE Chat_API SHALL sanitize user input to prevent XSS attacks
 * 
 * These tests verify that Helmet.js is properly configured in main.ts
 */
describe('Main.ts Helmet Configuration', () => {
  let mainFileContent: string;

  beforeAll(() => {
    const mainFilePath = path.join(__dirname, 'main.ts');
    mainFileContent = fs.readFileSync(mainFilePath, 'utf-8');
  });

  describe('Helmet Import and Configuration', () => {
    it('should import helmet from helmet package', () => {
      expect(mainFileContent).toContain("import helmet from 'helmet'");
    });

    it('should apply helmet middleware with app.use', () => {
      expect(mainFileContent).toContain('app.use(');
      expect(mainFileContent).toContain('helmet({');
    });

    it('should configure Content-Security-Policy', () => {
      expect(mainFileContent).toContain('contentSecurityPolicy');
      expect(mainFileContent).toContain('directives');
    });

    it('should have Task 8.2 comment marker', () => {
      expect(mainFileContent).toContain('TASK 8.2: Add Helmet.js security headers');
      expect(mainFileContent).toContain('Requirements: 8.11');
    });
  });

  describe('Content-Security-Policy Directives', () => {
    it('should configure default-src directive', () => {
      expect(mainFileContent).toContain('defaultSrc');
      expect(mainFileContent).toContain('"\'self\'"');
    });

    it('should configure script-src directive', () => {
      expect(mainFileContent).toContain('scriptSrc');
    });

    it('should configure style-src with unsafe-inline for API docs', () => {
      expect(mainFileContent).toContain('styleSrc');
      expect(mainFileContent).toContain('"\'unsafe-inline\'"');
      expect(mainFileContent).toContain('// Allow inline styles for API docs');
    });

    it('should configure img-src with data and https', () => {
      expect(mainFileContent).toContain('imgSrc');
      expect(mainFileContent).toContain("'data:'");
      expect(mainFileContent).toContain("'https:'");
    });

    it('should configure object-src to none', () => {
      expect(mainFileContent).toContain('objectSrc');
      expect(mainFileContent).toContain('"\'none\'"');
    });

    it('should configure frame-src to none', () => {
      expect(mainFileContent).toContain('frameSrc');
      expect(mainFileContent).toContain('"\'none\'"');
    });

    it('should configure connect-src directive', () => {
      expect(mainFileContent).toContain('connectSrc');
    });

    it('should configure font-src directive', () => {
      expect(mainFileContent).toContain('fontSrc');
    });

    it('should configure media-src directive', () => {
      expect(mainFileContent).toContain('mediaSrc');
    });
  });

  describe('Cross-Origin Configuration for API', () => {
    it('should disable crossOriginEmbedderPolicy for development', () => {
      expect(mainFileContent).toContain('crossOriginEmbedderPolicy: false');
      expect(mainFileContent).toContain('// Disable in development for better DX with Swagger');
    });

    it('should configure crossOriginResourcePolicy for API usage', () => {
      expect(mainFileContent).toContain('crossOriginResourcePolicy');
      expect(mainFileContent).toContain("policy: 'cross-origin'");
    });
  });

  describe('Security Documentation', () => {
    it('should document security headers in bootstrap function comments', () => {
      expect(mainFileContent).toContain('Security headers via Helmet.js');
    });

    it('should reference requirement 8.11 for XSS protection', () => {
      expect(mainFileContent).toContain('8.11');
    });
  });
});

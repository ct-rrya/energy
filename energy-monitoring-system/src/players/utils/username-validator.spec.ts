import { validateUsername } from './username-validator';

describe('validateUsername', () => {
  it('should accept valid usernames', () => {
    const validNames = ['EcoWarrior', 'green_step', 'solar-123', 'John_Doe', 'User99'];
    for (const name of validNames) {
      const res = validateUsername(name);
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe(name.trim().toLowerCase());
    }
  });

  it('should reject usernames shorter than 3 characters', () => {
    const res = validateUsername('ab');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('at least 3 characters');
  });

  it('should reject usernames longer than 20 characters', () => {
    const res = validateUsername('a_very_long_username_exceeding_twenty');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('cannot exceed 20 characters');
  });

  it('should reject usernames with invalid special characters', () => {
    const invalidNames = ['user@name', 'bad!name', 'test$1', 'hello space'];
    for (const name of invalidNames) {
      const res = validateUsername(name);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('letters, numbers, underscores');
    }
  });

  it('should reject reserved administrative keywords', () => {
    const reserved = ['admin', 'ADMIN', 'SuperAdmin', 'System', 'root', 'ecostep'];
    for (const name of reserved) {
      const res = validateUsername(name);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('reserved');
    }
  });

  it('should reject profanity / inappropriate language', () => {
    const badNames = ['bitch_player', 'bad_asshole', 'fuck_system'];
    for (const name of badNames) {
      const res = validateUsername(name);
      expect(res.isValid).toBe(false);
      expect(res.error).toContain('inappropriate');
    }
  });

  it('should properly normalize case and trim whitespace', () => {
    const res = validateUsername('   EcoStep_Pro   ');
    expect(res.isValid).toBe(true);
    expect(res.normalized).toBe('ecostep_pro');
  });
});

import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const jwtService = new JwtService({ secret: 'test-secret' });
    expect(new JwtAuthGuard(jwtService)).toBeDefined();
  });
});

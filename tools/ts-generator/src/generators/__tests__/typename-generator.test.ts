import { schemaFileToTypeName } from '../typename-generator.js';

describe('schemaFileToTypeName', () => {
  describe('basic functionality', () => {
    it('should convert simple lowercase name', () => {
      expect(schemaFileToTypeName('person.schema.json')).toBe('Person');
    });

    it('should convert already capitalized name', () => {
      expect(schemaFileToTypeName('Person.schema.json')).toBe('Person');
    });

    it('should convert all uppercase name', () => {
      expect(schemaFileToTypeName('PERSON.schema.json')).toBe('PERSON');
    });

    it('should convert mixed case name', () => {
      expect(schemaFileToTypeName('pErSoN.schema.json')).toBe('PErSoN');
    });
  });

  describe('hyphen separator', () => {
    it('should convert hyphenated name with two words', () => {
      expect(schemaFileToTypeName('user-profile.schema.json')).toBe('UserProfile');
    });

    it('should convert hyphenated name with three words', () => {
      expect(schemaFileToTypeName('user-profile-data.schema.json')).toBe('UserProfileData');
    });

    it('should convert hyphenated name with multiple hyphens', () => {
      expect(schemaFileToTypeName('my-super-complex-type.schema.json')).toBe('MySuperComplexType');
    });

    it('should handle leading hyphen', () => {
      expect(schemaFileToTypeName('-person.schema.json')).toBe('Person');
    });

    it('should handle trailing hyphen', () => {
      expect(schemaFileToTypeName('person-.schema.json')).toBe('Person');
    });

    it('should handle consecutive hyphens', () => {
      expect(schemaFileToTypeName('user--profile.schema.json')).toBe('UserProfile');
    });
  });

  describe('underscore separator', () => {
    it('should convert underscore name with two words', () => {
      expect(schemaFileToTypeName('user_profile.schema.json')).toBe('UserProfile');
    });

    it('should convert underscore name with three words', () => {
      expect(schemaFileToTypeName('user_profile_data.schema.json')).toBe('UserProfileData');
    });

    it('should convert underscore name with multiple underscores', () => {
      expect(schemaFileToTypeName('my_super_complex_type.schema.json')).toBe('MySuperComplexType');
    });

    it('should handle leading underscore', () => {
      expect(schemaFileToTypeName('_person.schema.json')).toBe('Person');
    });

    it('should handle trailing underscore', () => {
      expect(schemaFileToTypeName('person_.schema.json')).toBe('Person');
    });

    it('should handle consecutive underscores', () => {
      expect(schemaFileToTypeName('user__profile.schema.json')).toBe('UserProfile');
    });
  });

  describe('mixed separators', () => {
    it('should handle both hyphens and underscores', () => {
      expect(schemaFileToTypeName('user-profile_data.schema.json')).toBe('UserProfileData');
    });

    it('should handle alternating separators', () => {
      expect(schemaFileToTypeName('my_type-name_schema.schema.json')).toBe('MyTypeNameSchema');
    });

    it('should handle complex mixed separators', () => {
      expect(schemaFileToTypeName('api-v2_user_profile-data.schema.json')).toBe('ApiV2UserProfileData');
    });

    it('should handle consecutive mixed separators', () => {
      expect(schemaFileToTypeName('user-_profile.schema.json')).toBe('UserProfile');
    });

    it('should handle multiple consecutive mixed separators', () => {
      expect(schemaFileToTypeName('user--__profile.schema.json')).toBe('UserProfile');
    });
  });

  describe('numbers in names', () => {
    it('should handle number at the end', () => {
      expect(schemaFileToTypeName('user-profile2.schema.json')).toBe('UserProfile2');
    });

    it('should handle number at the beginning', () => {
      expect(schemaFileToTypeName('2user-profile.schema.json')).toBe('2userProfile');
    });

    it('should handle number in the middle', () => {
      expect(schemaFileToTypeName('user-v2-profile.schema.json')).toBe('UserV2Profile');
    });

    it('should handle multiple numbers', () => {
      expect(schemaFileToTypeName('api-v1-2-3-schema.schema.json')).toBe('ApiV123Schema');
    });
  });

  describe('file paths', () => {
    it('should handle absolute path', () => {
      expect(schemaFileToTypeName('/path/to/user-profile.schema.json')).toBe('UserProfile');
    });

    it('should handle relative path', () => {
      expect(schemaFileToTypeName('./schemas/user-profile.schema.json')).toBe('UserProfile');
    });

    it('should handle nested path', () => {
      expect(schemaFileToTypeName('../../schemas/user-profile.schema.json')).toBe('UserProfile');
    });
  });

  describe('edge cases', () => {
    it('should handle single character word', () => {
      expect(schemaFileToTypeName('a-b-c.schema.json')).toBe('ABC');
    });

    it('should handle empty parts between separators', () => {
      expect(schemaFileToTypeName('user--profile.schema.json')).toBe('UserProfile');
    });

    it('should handle all separators', () => {
      expect(schemaFileToTypeName('---___.schema.json')).toBe('');
    });

    it('should preserve camelCase within words', () => {
      expect(schemaFileToTypeName('userProfile.schema.json')).toBe('UserProfile');
    });

    it('should handle special characters in words', () => {
      expect(schemaFileToTypeName('user1-profile2.schema.json')).toBe('User1Profile2');
    });
  });

  describe('real-world examples', () => {
    it('should convert person schema', () => {
      expect(schemaFileToTypeName('person.schema.json')).toBe('Person');
    });

    it('should convert user-profile schema', () => {
      expect(schemaFileToTypeName('user-profile.schema.json')).toBe('UserProfile');
    });

    it('should convert company_info schema', () => {
      expect(schemaFileToTypeName('company_info.schema.json')).toBe('CompanyInfo');
    });

    it('should convert api-v2-request schema', () => {
      expect(schemaFileToTypeName('api-v2-request.schema.json')).toBe('ApiV2Request');
    });

    it('should convert snake_case_example schema', () => {
      expect(schemaFileToTypeName('snake_case_example.schema.json')).toBe('SnakeCaseExample');
    });

    it('should convert kebab-case-example schema', () => {
      expect(schemaFileToTypeName('kebab-case-example.schema.json')).toBe('KebabCaseExample');
    });

    it('should convert mixed-case_example schema', () => {
      expect(schemaFileToTypeName('mixed-case_example.schema.json')).toBe('MixedCaseExample');
    });
  });

  describe('case preservation within words', () => {
    it('should preserve uppercase letters within words', () => {
      expect(schemaFileToTypeName('userAPI.schema.json')).toBe('UserAPI');
    });

    it('should handle acronyms', () => {
      expect(schemaFileToTypeName('http-api-response.schema.json')).toBe('HttpApiResponse');
    });

    it('should handle mixed case words', () => {
      expect(schemaFileToTypeName('iPhone-data.schema.json')).toBe('IPhoneData');
    });
  });

  describe('multiple separators patterns', () => {
    it('should handle triple hyphens', () => {
      expect(schemaFileToTypeName('user---profile.schema.json')).toBe('UserProfile');
    });

    it('should handle triple underscores', () => {
      expect(schemaFileToTypeName('user___profile.schema.json')).toBe('UserProfile');
    });

    it('should handle alternating separator pattern', () => {
      expect(schemaFileToTypeName('a-b_c-d_e.schema.json')).toBe('ABCDE');
    });

    it('should handle complex separator combinations', () => {
      expect(schemaFileToTypeName('my--type__name---schema.schema.json')).toBe('MyTypeNameSchema');
    });
  });
});

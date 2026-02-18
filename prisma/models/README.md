# Prisma Models Directory

This directory contains individual model definitions for documentation and reference purposes.

## Files

- **User.prisma** - User model definition (core user entity)
- **PersonalityType.prisma** - PersonalityType model definition (personality types available in the system)
- **Profile.prisma** - Profile model definition (user profile information)
- **Company.prisma** - Company model definition (corporate/company information for users)
- **Team.prisma** - Team model definition (team entity)
- **TeamMate.prisma** - TeamMate model definition (junction table for team membership)
- **DimensionCategory.prisma** - DimensionCategory model definition (categories for dimension indexes)
- **DimensionIndex.prisma** - DimensionIndex model definition (dimension indexes for data analysis and filtering)

## Note

These files are for **reference only**. The actual Prisma schema that is used by the application is located in the parent directory at `schema.prisma`.

Prisma does not natively support splitting schemas across multiple files. All models must be defined in the main `schema.prisma` file to be recognized by Prisma.

## Usage

These individual model files can be useful for:

- Documentation
- Code organization reference
- Understanding model relationships
- Model-specific comments and notes
- Easy navigation to specific model definitions

For any schema changes, make sure to update both:

1. The main `../schema.prisma` file (required for Prisma to work)
2. The corresponding model file in this directory (for documentation purposes)

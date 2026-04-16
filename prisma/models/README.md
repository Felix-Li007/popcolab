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
- **DimensionApply.prisma** - DimensionApply model definition (dimension-to-form-name mapping entries)
- **DimensionOption.prisma** - DimensionOption model definition (allowed values under each dimension index)
- **Question.prisma** - Question model definition (questions in the system)
- **QuestionOption.prisma** - QuestionOption model definition (options/choices for questions)
- **QuestionDimension.prisma** - QuestionDimension model definition (relationship between questions and dimensions)
- **PersonalityProfile.prisma** - PersonalityProfile model definition (current saved personality result per user)
- **HistoryPreference.prisma** - HistoryPreference model definition (persisted recommendation preference snapshots)
- **Provider.prisma** - Provider model definition (authentication or service providers)
- **Category.prisma** - Category model definition (hierarchical categories for experiences)
- **Experience.prisma** - Experience model definition (experiences/activities offered by providers)
- **experience-pricing.prisma** - ExperiencePricing model definition (per-experience pricing details and billing model)
- **ExperienceCalendar.prisma** - ExperienceCalendar model definition (calendar schedule slots for experiences)
- **ExperienceDimension.prisma** - ExperienceDimension model definition (relationship between experiences and dimensions with expected values)
- **Request.prisma** - Request model definition (user requests for experiences)
- **RequestUser.prisma** - RequestUser model definition (users invited to join a request)
- **Proposal.prisma** - Proposal model definition (proposals matching requests with experiences)
- **order.prisma** - Order model definition (purchase/order records tied to proposals and users)
- **order-item.prisma** - OrderItem model definition (line items under each order)
- **payment.prisma** - Payment model definition (payment and tax records tied to orders)
- **RequestPreference.prisma** - RequestPreference model definition (user preferences for dimensions in a request)

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

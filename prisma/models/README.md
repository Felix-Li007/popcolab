# Prisma Models Directory

This directory contains individual model definitions for documentation and reference purposes.

## Files

- **User.prisma** - User model definition (core user entity)
- **PersonalityType.prisma** - PersonalityType model definition (personality types available in the system)
- **Profile.prisma** - Profile model definition (user profile information)
- **Company.prisma** - Company model definition (corporate/company information for users)
- **Team.prisma** - Team model definition (team entity)
- **TeamMate.prisma** - TeamMate model definition (junction table for team membership)
- **TeamAggregate.prisma** - TeamAggregate model definition (aggregated statistics for teams across dimensions)
- **TeamVector.prisma** - TeamVector model definition (vector representations of team data)
- **DimensionCategory.prisma** - DimensionCategory model definition (categories for dimension indexes)
- **DimensionIndex.prisma** - DimensionIndex model definition (dimension indexes for data analysis and filtering)
- **DimensionOption.prisma** - DimensionOption model definition (allowed values under each dimension index)
- **Question.prisma** - Question model definition (questions in the system)
- **QuestionOption.prisma** - QuestionOption model definition (options/choices for questions)
- **QuestionDimension.prisma** - QuestionDimension model definition (relationship between questions and dimensions)
- **Response.prisma** - Response model definition (user response session to questionnaire)
- **Answer.prisma** - Answer model definition (individual answers to questions)
- **UserScore.prisma** - UserScore model definition (calculated scores across dimensions)
- **UserVector.prisma** - UserVector model definition (vector representations of user responses)
- **Provider.prisma** - Provider model definition (authentication or service providers)
- **Experience.prisma** - Experience model definition (experiences/activities offered by providers)
- **ExperienceDimension.prisma** - ExperienceDimension model definition (relationship between experiences and dimensions with scores)
- **Request.prisma** - Request model definition (user requests for experiences)
- **Proposal.prisma** - Proposal model definition (proposals matching requests with experiences)
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

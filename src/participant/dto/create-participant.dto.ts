import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateParticipantDto {
  @ApiProperty({
    description: "The first name of the participant",
    example: "John",
  })
  firstName: string;

  @ApiProperty({
    description: "The last name of the participant",
    example: "Doe",
  })
  lastName: string;

  @ApiProperty({
    description: "The email of the participant",
    example: "john.doe@example.com",
  })
  email: string;

  @ApiPropertyOptional({
    description: "The phone number of the participant",
    example: "+1234567890",
  })
  phone?: string;
}

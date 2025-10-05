import { UserProfile } from '@clerk/nextjs'

export const UserProfilePage = () => (
  <UserProfile
    appearance={{
      elements: {
        header: 'hidden',
      },
    }}
  />
);

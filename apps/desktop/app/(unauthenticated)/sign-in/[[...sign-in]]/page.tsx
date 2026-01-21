import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import { SignInClientPage } from './client-page';

const title = 'Welcome back';
const description = 'Enter your details to sign in.';

export const metadata: Metadata = createMetadata({ title, description });

const SignInPage = () => <SignInClientPage title={title} description={description} />;

export default SignInPage;

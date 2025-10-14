import { createMetadata } from '@repo/seo/metadata';
import type { Metadata } from 'next';
import { SignUpClientPage } from './client-page';

const title = 'Create an account';
const description = 'Enter your details to get started.';

export const metadata: Metadata = createMetadata({ title, description });

const SignUpPage = () => <SignUpClientPage title={title} description={description} />;

export default SignUpPage;

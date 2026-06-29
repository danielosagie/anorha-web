import { VercelToolbar } from '@vercel/toolbar/next';
import { keys } from '../keys';

export const Toolbar = () => {
    if (process.env.NODE_ENV === 'development') {
        return null;
    }
    return keys().FLAGS_SECRET ? <VercelToolbar /> : null;
};

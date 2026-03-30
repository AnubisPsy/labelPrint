import api from './api';
import { Article } from '../types';

export type Localidad = 'la-ceiba' | 'tocoa' | 'roatan';

export const articleService = {
  getByCode: async (code: string, localidad: Localidad): Promise<Article> => {
    const response = await api.get<Article>(`/precios/${localidad}/${code}`);
    return response.data;
  },
};

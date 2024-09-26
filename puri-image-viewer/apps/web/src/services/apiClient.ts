import { API_BASE_URL } from '@web/constants';

export const fetchSealImages = async (inputSealId: string, idToken: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/seals/${inputSealId}/images`,
      {
        method: 'GET',
        headers: {
          Authorization: idToken,
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to fetch images');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

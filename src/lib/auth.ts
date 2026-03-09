// Fungsi ini akan otomatis nyari key bernama 'token' di browser kamu
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
}

// Fungsi ini wajib ada biar kalau error 400/500 dari Spring Boot bisa ketangkap
export const handleApiResponse = async (response: Response) => {
  let data: any = null;

  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    console.warn('Response is not valid JSON');
  }

  if (!response.ok) {
    const errorMessage = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return data;
}

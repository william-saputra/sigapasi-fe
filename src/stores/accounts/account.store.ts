import type { Users, AccountRequest, AccountUpdate } from '@/interfaces/accounts/account.interface';
import { defineStore } from 'pinia'
import axios from "axios";
import { toast } from 'vue-sonner';
import type { BaseResponse } from '@/interfaces/base-response.interface';
import { handleAuthError, getAuthToken } from '@/lib/auth';
import { useRouter } from 'vue-router';

const baseAccountUrl = import.meta.env.VITE_API_URL + '/account';

export const useAccountStore = defineStore('account', {
    state: () => ({
        accounts: [] as Users[],
        loading: false,
        error: null as null | string,
    }),
    actions: {
        async fetchAccounts() {
            this.loading = true;
            this.error = null;
            const router = useRouter();
            const token = getAuthToken();

            try {
                const response = await axios.get<BaseResponse<Users[]>>(baseAccountUrl, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                this.accounts = response.data.data;
                if (this.accounts.length === 0) {
                    toast.warning('There is no accounts')
                }
                else {
                    toast.success('Account successfully load')
                }
                return response.data.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    await handleAuthError(error.response.status, router)
                }
                this.error = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Error while loading profile: ${this.error}`);
            } finally {
                this.loading = false;
            }
        },

        async getProfileById(profileId: string) {
            this.loading = true;
            this.error = null;
            const router = useRouter();
            const token = getAuthToken();

            try {
                const response = await axios.get<BaseResponse<Users>>(`${baseAccountUrl}/${profileId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return response.data.data;
            } catch (error) {
                if (axios.isAxiosError(error) && error.response) {
                    await handleAuthError(error.response.status, router)
                }
                this.error = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Error: ${this.error}`);
                return null;
            } finally {
                this.loading = false;
            }
        },

        async createProfile(accountData: AccountRequest) {
            this.loading = true;
            this.error = null;

            try {
                const response = await axios.post<BaseResponse<Users>>(`${baseAccountUrl}/create`, accountData);
                if (response.status === 201) {
                    this.accounts.push(response.data.data);
                    toast.success('Account succesfully created')
                    return response.data.data;
                }
                else if (response.status === 400) {
                    toast.warning('Failed creating account')
                }
            }
            catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Error: ${this.error}`);
            } finally {
                this.loading = false;
            }
        },

        async updateProfile(accountData: AccountUpdate) {
            this.loading = true;
            this.error = null;
            const token = getAuthToken();

            try {
                const response = await axios.put<BaseResponse<Users>>(`${baseAccountUrl}/update`, accountData, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.status === 200) {
                    toast.success('Account successfully updated')
                    return response.data.data;
                }
                else if (response.status === 400) {
                    toast.warning('Failed updating account')
                }
                else if (response.status === 404) {
                    toast.warning('Account not found')
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Error: ${this.error}`);

            } finally {
                this.loading = false;
            }
        },

        async deleteProfile(accountId: string) {
            this.loading = true;
            this.error = null;
            const token = getAuthToken();
            try {
                const response = await axios.delete<BaseResponse<Users>>(`${baseAccountUrl}/delete/${accountId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                if (response.status === 200) {
                    await this.fetchAccounts();
                    toast.success('Account successfully deleted');
                }
                else if (response.status === 404) {
                    toast.warning('Account not found');
                }
            } catch (error) {
                this.error = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Error: ${this.error}`);
            } finally {
                this.loading = false;
            }
        }

    }
})
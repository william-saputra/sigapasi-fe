import type {
  Users,
  AccountRequest,
  AccountUpdate,
} from '@/interfaces/accounts/account.interface'
import type { Subjects } from '@/interfaces/accounts/subjects.interface'
import type { BaseResponse } from '@/interfaces/base-response.interface'

import { defineStore } from 'pinia'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { getAuthToken } from '@/lib/auth'

const baseAccountUrl = `${import.meta.env.VITE_API_URL}/accounts`

function getAuthHeaders() {
  const token = getAuthToken()

  return {
    Authorization: `Bearer ${token}`,
  }
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Unknown error'
    )
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
}

function showSuccess(message?: string) {
  toast.success(message || 'Operation successful')
}

function showWarning(message?: string) {
  toast.warning(message || 'Operation failed')
}

function showError(error: unknown) {
  const message = getErrorMessage(error)
  toast.error(message)
  return message
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as Users[],
    subjects: [] as Subjects[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchAccounts() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<Users[]>>(baseAccountUrl, {
          headers: getAuthHeaders(),
        })

        this.accounts = response.data.data ?? []

        return this.accounts
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loading = false
      }
    },

    async fetchSubjects() {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<Subjects[]>>(
          `${baseAccountUrl}/subjects`,
          {
            headers: getAuthHeaders(),
          },
        )

        this.subjects = response.data.data ?? []

        return this.subjects
      } catch (error) {
        this.error = showError(error)
        return []
      } finally {
        this.loading = false
      }
    },

    async getProfileById(profileId: string) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.get<BaseResponse<Users>>(
          `${baseAccountUrl}/${profileId}`,
          {
            headers: getAuthHeaders(),
          },
        )

        const account = response.data.data ?? null

        if (!account) {
          showWarning('Account not found')
          return null
        }

        return account
      } catch (error) {
        this.error = showError(error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createProfile(accountData: AccountRequest) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post<BaseResponse<Users>>(
          `${baseAccountUrl}/create`,
          accountData,
          {
            headers: getAuthHeaders(),
          },
        )

        const createdAccount = response.data.data ?? null

        if (!createdAccount) {
          showWarning(response.data.message || 'Failed creating account')
          return null
        }

        this.accounts.push(createdAccount)
        showSuccess(response.data.message || 'Account successfully created')

        return createdAccount
      } catch (error) {
        this.error = showError(error)
        return null
      } finally {
        this.loading = false
      }
    },

    async updateProfile(accountData: AccountUpdate) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.put<BaseResponse<Users>>(
          `${baseAccountUrl}/update`,
          accountData,
          {
            headers: getAuthHeaders(),
          },
        )

        const updatedAccount = response.data.data ?? null

        if (!updatedAccount) {
          showWarning(response.data.message || 'Failed updating account')
          return null
        }

        const index = this.accounts.findIndex(
          (account) => account.id === updatedAccount.id,
        )

        if (index !== -1) {
          this.accounts[index] = updatedAccount
        } else {
          this.accounts.push(updatedAccount)
        }

        showSuccess(response.data.message || 'Account successfully updated')

        return updatedAccount
      } catch (error) {
        this.error = showError(error)
        return null
      } finally {
        this.loading = false
      }
    },

    async deleteProfile(accountId: string) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.delete<BaseResponse<Users>>(
          `${baseAccountUrl}/delete/${accountId}`,
          {
            headers: getAuthHeaders(),
          },
        )

        this.accounts = this.accounts.filter((account) => account.id !== accountId)
        showSuccess(response.data.message || 'Account successfully deleted')

        return true
      } catch (error) {
        this.error = showError(error)
        return false
      } finally {
        this.loading = false
      }
    },
  },
})

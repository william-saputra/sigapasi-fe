import type {
  Users,
  AccountRequest,
  AccountUpdate,
} from '@/interfaces/accounts/account.interface'
import type { Subjects } from '@/interfaces/accounts/subjects.interface'
import type { BaseResponse } from '@/interfaces/base-response.interface'

import { defineStore } from 'pinia'
import axios, { AxiosError } from 'axios'
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
    return error.response?.data?.message || error.message || 'Unknown error'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unknown error'
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
        this.error = getErrorMessage(error)
        toast.error(`Error while loading accounts: ${this.error}`)
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
        this.error = getErrorMessage(error)
        toast.error(`Error while loading subjects: ${this.error}`)
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

        return response.data.data ?? null
      } catch (error) {
        this.error = getErrorMessage(error)
        toast.error(`Error while loading account detail: ${this.error}`)
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

        const createdAccount = response.data.data

        if (createdAccount) {
          this.accounts.push(createdAccount)
          toast.success('Account successfully created')
          return createdAccount
        }

        toast.warning('Failed creating account')
        return null
      } catch (error) {
        this.error = getErrorMessage(error)
        toast.error(`Error while creating account: ${this.error}`)
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

        const updatedAccount = response.data.data

        if (updatedAccount) {
          const index = this.accounts.findIndex(
            (account) => account.id === updatedAccount.id,
          )

          if (index !== -1) {
            this.accounts[index] = updatedAccount
          }

          toast.success('Account successfully updated')
          return updatedAccount
        }

        toast.warning('Failed updating account')
        return null
      } catch (error) {
        this.error = getErrorMessage(error)
        toast.error(`Error while updating account: ${this.error}`)
        return null
      } finally {
        this.loading = false
      }
    },

    async deleteProfile(accountId: string) {
      this.loading = true
      this.error = null

      try {
        await axios.delete<BaseResponse<Users>>(
          `${baseAccountUrl}/delete/${accountId}`,
          {
            headers: getAuthHeaders(),
          },
        )

        this.accounts = this.accounts.filter((account) => account.id !== accountId)

        toast.success('Account successfully deleted')
        return true
      } catch (error) {
        this.error = getErrorMessage(error)
        toast.error(`Error while deleting account: ${this.error}`)
        return false
      } finally {
        this.loading = false
      }
    },
  },
})
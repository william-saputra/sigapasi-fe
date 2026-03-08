import type { Users, AccountRequest, AccountUpdate } from '@/interfaces/accounts/account.interface';
import { defineStore } from 'pinia'
import axios from "axios";
import { toast } from 'vue-sonner';
import type { BaseResponse } from '@/interfaces/base-response.interface';
import { handleAuthError, getAuthToken } from '@/lib/auth';
import { useRouter } from 'vue-router';


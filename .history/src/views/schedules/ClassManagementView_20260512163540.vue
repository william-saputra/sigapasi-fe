<script setup lang="ts">
<<<<<<< HEAD
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import VButton from '@/components/common/VButton.vue';
import BaseModal from '@/components/common/BaseModal.vue';
import { useClassManagementStore } from '@/stores/schedules/classManagementStore';
import { storeToRefs } from 'pinia';

const router = useRouter();
const store = useClassManagementStore();
const { 
  classes, 
  schoolLevels, 
  allSubjectsByLevel, 
  selectedClass, 
  activeTargets, 
  loading 
} = storeToRefs(store);

// Fetch initial data
onMounted(() => {
  store.fetchClasses();
  store.fetchSchoolLevels();
});

const searchQuery = ref('');

// Filter classes by name
const filteredClasses = computed(() => {
  if (!searchQuery.value) return classes.value;
  return classes.value.filter(c => 
    c.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

// Since we map subject selection, we need available subjects.
const getAvailableSubjects = (currentSubjectId: string) => {
  const selectedIds = activeTargets.value.map(t => t.subjectId).filter(id => id !== '');
  return allSubjectsByLevel.value.filter(subject => {
     return !selectedIds.includes(subject.id) || subject.id === currentSubjectId;
  });
};

const handleLevelChange = async () => {
  if(selectedClass.value?.schoolLevelId) {
    await store.fetchAllSubjectsByLevel(selectedClass.value.schoolLevelId);
  }
};

const classNameSuffix = ref('');
=======
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import VButton from '@/components/common/VButton.vue'
import BaseModal from '@/components/common/BaseModal.vue'
import { useClassManagementStore } from '@/stores/schedules/classManagementStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useClassManagementStore()
const { classes, schoolLevels, allSubjectsByLevel, selectedClass, activeTargets, loading } =
  storeToRefs(store)

// Fetch initial data
onMounted(() => {
  store.fetchClasses()
  store.fetchSchoolLevels()
})

const searchQuery = ref('')

// Filter classes by name
const filteredClasses = computed(() => {
  if (!searchQuery.value) return classes.value
  return classes.value.filter((c) => c.name.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

// Since we map subject selection, we need available subjects.
const getAvailableSubjects = (currentSubjectId: string) => {
  const selectedIds = activeTargets.value.map((t) => t.subjectId).filter((id) => id !== '')
  return allSubjectsByLevel.value.filter((subject) => {
    return !selectedIds.includes(subject.id) || subject.id === currentSubjectId
  })
}

const handleLevelChange = async () => {
  if (selectedClass.value?.schoolLevelId) {
    await store.fetchAllSubjectsByLevel(selectedClass.value.schoolLevelId)
  }
}

const classNameSuffix = ref('')
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6

// Logika ekstraksi nama yang tahan terhadap format tanpa spasi (misal: "1-A")
function extractSuffix(targetClass = selectedClass.value) {
  if (targetClass) {
    if (targetClass.gradeLevel && targetClass.name) {
<<<<<<< HEAD
      const prefixRegex = new RegExp(`^${targetClass.gradeLevel}`, 'i');
      classNameSuffix.value = targetClass.name.replace(prefixRegex, '').trimStart();
    } else {
      classNameSuffix.value = targetClass.name || '';
    }
  } else {
    classNameSuffix.value = '';
=======
      const prefixRegex = new RegExp(`^${targetClass.gradeLevel}`, 'i')
      classNameSuffix.value = targetClass.name.replace(prefixRegex, '').trimStart()
    } else {
      classNameSuffix.value = targetClass.name || ''
    }
  } else {
    classNameSuffix.value = ''
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
  }
}

// [PERBAIKAN 1]: Kombinasi nama yang rapih untuk mencegah spasi ganda
function updateCombinedName() {
<<<<<<< HEAD
  if (!selectedClass.value) return;
  const prefix = selectedClass.value.gradeLevel ? String(selectedClass.value.gradeLevel) : '';
  const suffix = classNameSuffix.value;
  
  if (prefix && suffix) {
    // Jika user mengetik strip (-) di awal, jangan tambahkan spasi
    if (suffix.startsWith('-') || suffix.startsWith(' ')) {
      selectedClass.value.name = prefix + suffix;
    } else {
      selectedClass.value.name = `${prefix} ${suffix}`;
    }
  } else {
    selectedClass.value.name = prefix + suffix;
=======
  if (!selectedClass.value) return
  const prefix = selectedClass.value.gradeLevel ? String(selectedClass.value.gradeLevel) : ''
  const suffix = classNameSuffix.value

  if (prefix && suffix) {
    // Jika user mengetik strip (-) di awal, jangan tambahkan spasi
    if (suffix.startsWith('-') || suffix.startsWith(' ')) {
      selectedClass.value.name = prefix + suffix
    } else {
      selectedClass.value.name = `${prefix} ${suffix}`
    }
  } else {
    selectedClass.value.name = prefix + suffix
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
  }
}

function onClassNameInput(e: Event) {
<<<<<<< HEAD
  const input = e.target as HTMLInputElement;
  // Hanya menerima huruf, angka, spasi, titik, strip
  input.value = input.value.replace(/[^a-zA-Z0-9 .-]/g, '');
  classNameSuffix.value = input.value;
  updateCombinedName();
}

// Watcher untuk membersihkan Target Mapel jika Jenjang berubah
watch(() => selectedClass.value?.gradeLevel, async (newGrade, oldGrade) => {
  if (newGrade === undefined || newGrade === null || String(newGrade) === '') return;
  
  let targetLevelName = '';
  if (newGrade >= 1 && newGrade <= 6) targetLevelName = 'SD';
  else if (newGrade >= 7 && newGrade <= 9) targetLevelName = 'SMP';
  else if (newGrade >= 10 && newGrade <= 12) targetLevelName = 'SMA';
  
  if (targetLevelName) {
    const level = schoolLevels.value.find(l => l.name === targetLevelName);
    if (level && selectedClass.value && selectedClass.value.schoolLevelId !== level.id) {
      selectedClass.value.schoolLevelId = level.id;
      handleLevelChange();
      
      // Jika perubahan jenjang dipicu oleh ketikan user (bukan load dari sidebar)
      if (oldGrade !== undefined) {
         // 1. Tembak API DELETE ke backend untuk setiap target yang sudah tersimpan di DB
         for (const target of activeTargets.value) {
           if (target.id) { // Hanya hapus yang memiliki ID (sudah tersimpan di backend)
             await store.deleteTargetForSelectedClass(target.id);
           }
         }
         // 2. Baru kosongkan state lokal di layar
         activeTargets.value = [];
      }
    }
  }
  updateCombinedName();
});

const selectClass = async (cls: any) => {
  extractSuffix(cls);
  
  await store.selectClass(cls);
};

const addClass = () => {
  classNameSuffix.value = ''; 
  
  store.initNewClass();
  
  // Fetch subjects for default school level
  const firstLevel = schoolLevels.value[0];
  if (firstLevel && firstLevel.id) {
    store.fetchAllSubjectsByLevel(firstLevel.id);
  }
};

// Target summary fallback: local computation
const totalHours = computed(() => {
  return activeTargets.value.reduce((total, target) => total + (Number(target.targetHours) || 0), 0);
});

const addSubject = () => {
  activeTargets.value.push({ 
    id: '', 
    classId: selectedClass.value?.id || '', 
    subjectId: '', 
    targetHours: 0 
  });
};

const removeSubject = async (index: number) => {
  const target = activeTargets.value[index];
  if (!target) return;
  
  if (target.id) {
    await store.deleteTargetForSelectedClass(target.id);
  } else {
    activeTargets.value.splice(index, 1);
  }
};

const modalState = ref<{
  show: boolean;
  type: 'success' | 'error' | 'confirm';
  title: string;
  message: string;
  onConfirm?: () => void;
=======
  const input = e.target as HTMLInputElement
  // Hanya menerima huruf, angka, spasi, titik, strip
  input.value = input.value.replace(/[^a-zA-Z0-9 .-]/g, '')
  classNameSuffix.value = input.value
  updateCombinedName()
}

// Watcher untuk membersihkan Target Mapel jika Jenjang berubah
watch(
  () => selectedClass.value?.gradeLevel,
  async (newGrade, oldGrade) => {
    if (newGrade === undefined || newGrade === null || String(newGrade) === '') return

    let targetLevelName = ''
    if (newGrade >= 1 && newGrade <= 6) targetLevelName = 'SD'
    else if (newGrade >= 7 && newGrade <= 9) targetLevelName = 'SMP'
    else if (newGrade >= 10 && newGrade <= 12) targetLevelName = 'SMA'

    if (targetLevelName) {
      const level = schoolLevels.value.find((l) => l.name === targetLevelName)
      if (level && selectedClass.value && selectedClass.value.schoolLevelId !== level.id) {
        selectedClass.value.schoolLevelId = level.id
        handleLevelChange()

        // Jika perubahan jenjang dipicu oleh ketikan user (bukan load dari sidebar)
        if (oldGrade !== undefined) {
          // 1. Tembak API DELETE ke backend untuk setiap target yang sudah tersimpan di DB
          for (const target of activeTargets.value) {
            if (target.id) {
              // Hanya hapus yang memiliki ID (sudah tersimpan di backend)
              await store.deleteTargetForSelectedClass(target.id)
            }
          }
          // 2. Baru kosongkan state lokal di layar
          activeTargets.value = []
        }
      }
    }
    updateCombinedName()
  },
)

const selectClass = async (cls: any) => {
  extractSuffix(cls)

  await store.selectClass(cls)
}

const addClass = () => {
  classNameSuffix.value = ''

  store.initNewClass()

  // Fetch subjects for default school level
  const firstLevel = schoolLevels.value[0]
  if (firstLevel && firstLevel.id) {
    store.fetchAllSubjectsByLevel(firstLevel.id)
  }
}

// Target summary fallback: local computation
const totalHours = computed(() => {
  return activeTargets.value.reduce((total, target) => total + (Number(target.targetHours) || 0), 0)
})

const addSubject = () => {
  activeTargets.value.push({
    id: '',
    classId: selectedClass.value?.id || '',
    subjectId: '',
    targetHours: 0,
  })
}

const removeSubject = async (index: number) => {
  const target = activeTargets.value[index]
  if (!target) return

  if (target.id) {
    await store.deleteTargetForSelectedClass(target.id)
  } else {
    activeTargets.value.splice(index, 1)
  }
}

const modalState = ref<{
  show: boolean
  type: 'success' | 'error' | 'confirm'
  title: string
  message: string
  onConfirm?: () => void
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
}>({
  show: false,
  type: 'success',
  title: '',
  message: '',
<<<<<<< HEAD
});

const showSuccessModal = (message: string) => {
  modalState.value = { show: true, type: 'success', title: 'Berhasil', message };
};

const showErrorModal = (message: string) => {
  modalState.value = { show: true, type: 'error', title: 'Gagal', message };
};

const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
  modalState.value = { show: true, type: 'confirm', title, message, onConfirm };
};

const closeModal = () => {
  modalState.value.show = false;
};

const saveConfig = async () => {
  if (!selectedClass.value) return;

  if (!classNameSuffix.value || classNameSuffix.value.trim() === '') {
    showErrorModal('Nama Kelas tidak boleh kosong!');
    return;
  }

  if (!selectedClass.value.gradeLevel) {
    showErrorModal('Tingkat Kelas harus diisi!');
    return;
  }

  if (selectedClass.value.gradeLevel < 1 || selectedClass.value.gradeLevel > 12) {
    showErrorModal('Tingkat Kelas harus berada di rentang 1 - 12!');
    return;
  }

  const targetPayload = activeTargets.value
    .filter(t => t.subjectId !== '')
    .map(t => ({
      id: t.id,
      subjectId: t.subjectId,
      targetHours: t.targetHours
    }));
    
  const success = await store.saveAllConfig(targetPayload);
  if (success) {
    showSuccessModal('Konfigurasi berhasil disimpan!');
  } else {
    showErrorModal(store.error || 'Gagal menyimpan konfigurasi!');
  }
};

const deleteClassConfirm = async () => {
  const success = await store.deleteSelectedClass();
  if (success) {
    showSuccessModal('Kelas berhasil dihapus!');
  } else {
    showErrorModal(store.error || 'Gagal menghapus kelas!');
  }
};
=======
})

const showSuccessModal = (message: string) => {
  modalState.value = { show: true, type: 'success', title: 'Berhasil', message }
}

const showErrorModal = (message: string) => {
  modalState.value = { show: true, type: 'error', title: 'Gagal', message }
}

const showConfirmModal = (title: string, message: string, onConfirm: () => void) => {
  modalState.value = { show: true, type: 'confirm', title, message, onConfirm }
}

const closeModal = () => {
  modalState.value.show = false
}

const saveConfig = async () => {
  if (!selectedClass.value) return

  if (!classNameSuffix.value || classNameSuffix.value.trim() === '') {
    showErrorModal('Nama Kelas tidak boleh kosong!')
    return
  }

  if (!selectedClass.value.gradeLevel) {
    showErrorModal('Tingkat Kelas harus diisi!')
    return
  }

  if (selectedClass.value.gradeLevel < 1 || selectedClass.value.gradeLevel > 12) {
    showErrorModal('Tingkat Kelas harus berada di rentang 1 - 12!')
    return
  }

  const targetPayload = activeTargets.value
    .filter((t) => t.subjectId !== '')
    .map((t) => ({
      id: t.id,
      subjectId: t.subjectId,
      targetHours: t.targetHours,
    }))

  const success = await store.saveAllConfig(targetPayload)
  if (success) {
    showSuccessModal('Konfigurasi berhasil disimpan!')
  } else {
    showErrorModal(store.error || 'Gagal menyimpan konfigurasi!')
  }
}

const deleteClassConfirm = async () => {
  const success = await store.deleteSelectedClass()
  if (success) {
    showSuccessModal('Kelas berhasil dihapus!')
  } else {
    showErrorModal(store.error || 'Gagal menghapus kelas!')
  }
}
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6

const deleteClass = () => {
  showConfirmModal(
    'Hapus Kelas', // title
    'Hapus kelas ini bersama sasaran pelajarannya?', // message
<<<<<<< HEAD
    deleteClassConfirm
  );
};
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#f8fafc]"> 
    <aside class="w-[360px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] z-10">
=======
    deleteClassConfirm,
  )
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-[#f8fafc]">
    <aside
      class="w-[360px] flex-shrink-0 flex flex-col bg-white border-r border-gray-200 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] z-10"
    >
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      <div class="p-6 border-b border-gray-100">
        <div class="mb-4">
          <button
            @click="router.push('/jadwal')"
            class="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-emerald-800"
          >
<<<<<<< HEAD
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 19-7-7 7-7"/>
              <path d="M19 12H5"/>
=======
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
            </svg>
            Kembali ke Dashboard
          </button>
        </div>
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-bold text-gray-800">Manajemen Kelas</h2>
          <VButton variant="primary" size="sm" @click="addClass" class="shadow-sm">
            <span class="flex items-center gap-1">
<<<<<<< HEAD
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
=======
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              Baru
            </span>
          </VButton>
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
<<<<<<< HEAD
            <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            v-model="searchQuery" 
            type="text" 
=======
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
            placeholder="Cari kelas..."
            class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none transition-all text-sm"
          />
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <div class="space-y-1">
<<<<<<< HEAD
          <button 
            v-for="cls in filteredClasses" 
=======
          <button
            v-for="cls in filteredClasses"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
            :key="cls.id"
            @click="selectClass(cls)"
            class="w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group border"
            :class="{
<<<<<<< HEAD
              'bg-[#014f01]/5 border-[#014f01]/20 shadow-sm': selectedClass && selectedClass.id === cls.id,
              'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100': !selectedClass || selectedClass.id !== cls.id
            }"
          >
            <div>
              <span class="block font-bold text-gray-800 text-base" :class="{'text-[#014f01]': selectedClass && selectedClass.id === cls.id}">
                {{ cls.name }}
              </span>
              <span class="text-xs font-medium text-gray-500 mt-0.5 block">Tingkat {{ cls.gradeLevel }}</span>
            </div>
            <span class="px-2.5 py-1 rounded-md text-xs font-bold"
                  :class="{
                    'bg-blue-100 text-blue-700': cls.schoolLevelName === 'SD',
                    'bg-purple-100 text-purple-700': cls.schoolLevelName === 'SMP',
                    'bg-orange-100 text-orange-700': cls.schoolLevelName === 'SMA'
                  }">
=======
              'bg-[#014f01]/5 border-[#014f01]/20 shadow-sm':
                selectedClass && selectedClass.id === cls.id,
              'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100':
                !selectedClass || selectedClass.id !== cls.id,
            }"
          >
            <div>
              <span
                class="block font-bold text-gray-800 text-base"
                :class="{ 'text-[#014f01]': selectedClass && selectedClass.id === cls.id }"
              >
                {{ cls.name }}
              </span>
              <span class="text-xs font-medium text-gray-500 mt-0.5 block"
                >Tingkat {{ cls.gradeLevel }}</span
              >
            </div>
            <span
              class="px-2.5 py-1 rounded-md text-xs font-bold"
              :class="{
                'bg-blue-100 text-blue-700': cls.schoolLevelName === 'SD',
                'bg-purple-100 text-purple-700': cls.schoolLevelName === 'SMP',
                'bg-orange-100 text-orange-700': cls.schoolLevelName === 'SMA',
              }"
            >
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              {{ cls.schoolLevelName || 'Unknown' }}
            </span>
          </button>
        </div>
<<<<<<< HEAD
        <div v-if="filteredClasses.length === 0" class="p-6 text-center text-gray-400 text-sm mt-10">
=======
        <div
          v-if="filteredClasses.length === 0"
          class="p-6 text-center text-gray-400 text-sm mt-10"
        >
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          <p v-if="loading">Memuat data kelas...</p>
          <p v-else>Tidak ada kelas yang ditemukan.</p>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col relative overflow-y-auto">
      <div v-if="!selectedClass" class="flex-1 flex items-center justify-center p-8">
        <div class="text-center max-w-md">
<<<<<<< HEAD
          <div class="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
            <svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Pilih Kelas</h3>
          <p class="text-gray-500 text-sm leading-relaxed">Pilih kelas dari menu di sebelah kiri untuk mengatur identitas kelas dan target beban jam pelajaran per minggu.</p>
=======
          <div
            class="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100"
          >
            <svg
              class="h-10 w-10 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">Pilih Kelas</h3>
          <p class="text-gray-500 text-sm leading-relaxed">
            Pilih kelas dari menu di sebelah kiri untuk mengatur identitas kelas dan target beban
            jam pelajaran per minggu.
          </p>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
        </div>
      </div>

      <template v-else>
        <div class="flex-1 p-8 md:p-10 max-w-4xl mx-auto w-full pb-10">
<<<<<<< HEAD
          
=======
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          <div class="mb-8 flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 tracking-tight">
                {{ selectedClass.id ? 'Edit Kelas: ' + selectedClass.name : 'Buat Kelas Baru' }}
              </h1>
<<<<<<< HEAD
              <p class="text-gray-500 text-sm mt-1">Atur informasi dasar dan kebutuhan jam mengajar.</p>
            </div>
            <button v-if="selectedClass.id" @click="deleteClass" class="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2 px-3 py-2 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
=======
              <p class="text-gray-500 text-sm mt-1">
                Atur informasi dasar dan kebutuhan jam mengajar.
              </p>
            </div>
            <button
              v-if="selectedClass.id"
              @click="deleteClass"
              class="text-red-500 hover:text-red-700 text-sm font-semibold flex items-center gap-2 px-3 py-2 border border-red-100 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              Hapus Kelas
            </button>
          </div>

<<<<<<< HEAD
          <section class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
              <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Informasi Dasar</h3>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="md:col-span-1">
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Tingkat</label>
                <input 
                  v-model.number="selectedClass.gradeLevel" 
                  type="number" 
                  class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none transition-all text-gray-800 font-medium"
                  placeholder="Contoh: 10"
                  min="1" max="12"
=======
          <section
            class="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8 overflow-hidden"
          >
            <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
              <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Informasi Dasar
              </h3>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div class="md:col-span-1">
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase"
                  >Tingkat</label
                >
                <input
                  v-model.number="selectedClass.gradeLevel"
                  type="number"
                  class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none transition-all text-gray-800 font-medium"
                  placeholder="Contoh: 10"
                  min="1"
                  max="12"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                />
              </div>

              <div class="md:col-span-1">
<<<<<<< HEAD
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Nama Kelas</label>
                <div class="flex items-center">
                  <span class="px-3 py-2.5 bg-gray-100 border border-gray-300 border-r-0 rounded-l-xl text-gray-500 font-bold whitespace-nowrap">
                    {{ selectedClass.gradeLevel || '-' }}
                  </span>
                  <input 
                    :value="classNameSuffix"
                    @input="onClassNameInput"
                    type="text" 
=======
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase"
                  >Nama Kelas</label
                >
                <div class="flex items-center">
                  <span
                    class="px-3 py-2.5 bg-gray-100 border border-gray-300 border-r-0 rounded-l-xl text-gray-500 font-bold whitespace-nowrap"
                  >
                    {{ selectedClass.gradeLevel || '-' }}
                  </span>
                  <input
                    :value="classNameSuffix"
                    @input="onClassNameInput"
                    type="text"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                    class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-r-xl focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none transition-all text-gray-800 font-medium"
                    placeholder="Contoh: IPA 1"
                    maxlength="20"
                  />
                </div>
              </div>
<<<<<<< HEAD
              
              <div class="md:col-span-1">
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase">Jenjang</label>
                <div class="relative">
                  <select 
=======

              <div class="md:col-span-1">
                <label class="block text-xs font-bold text-gray-500 mb-1.5 uppercase"
                  >Jenjang</label
                >
                <div class="relative">
                  <select
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                    v-model="selectedClass.schoolLevelId"
                    @change="handleLevelChange"
                    :disabled="!!selectedClass.gradeLevel"
                    class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none transition-all text-gray-800 font-medium appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <option v-for="level in schoolLevels" :key="level.id" :value="level.id">
                      {{ level.name }}
                    </option>
                  </select>
<<<<<<< HEAD
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
=======
                  <div
                    class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
<<<<<<< HEAD
            <div class="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
              <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">Target Mata Pelajaran</h3>
=======
            <div
              class="px-6 py-4 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center"
            >
              <h3 class="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Target Mata Pelajaran
              </h3>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              <span class="bg-[#014f01]/10 text-[#014f01] py-1 px-3 rounded-full text-xs font-bold">
                {{ activeTargets.length }} Mapel
              </span>
            </div>
<<<<<<< HEAD
            
            <div class="p-6">
              <div class="space-y-3 mb-6">
                
                <div class="hidden md:flex items-center px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
=======

            <div class="p-6">
              <div class="space-y-3 mb-6">
                <div
                  class="hidden md:flex items-center px-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider"
                >
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                  <div class="flex-1">Mata Pelajaran</div>
                  <div class="w-48 text-center">Beban Jam / Minggu</div>
                  <div class="w-12"></div>
                </div>

<<<<<<< HEAD
                <div v-if="activeTargets.length === 0" class="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                  <p class="text-gray-500 text-sm">Belum ada mata pelajaran. Klik tombol di bawah untuk menambah.</p>
                </div>

                <div v-for="(target, index) in activeTargets" :key="index" 
                     class="flex flex-col md:flex-row items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group">
                  
                  <div class="flex-1 w-full relative">
                    <select 
                      v-model="target.subjectId" 
                      class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none text-gray-800 font-medium appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Mapel...</option>
                      <option v-for="sub in getAvailableSubjects(target.subjectId)" :key="sub.id" :value="sub.id">
                        {{ sub.name }}
                      </option>
                    </select>
                    <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
=======
                <div
                  v-if="activeTargets.length === 0"
                  class="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl"
                >
                  <p class="text-gray-500 text-sm">
                    Belum ada mata pelajaran. Klik tombol di bawah untuk menambah.
                  </p>
                </div>

                <div
                  v-for="(target, index) in activeTargets"
                  :key="index"
                  class="flex flex-col md:flex-row items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors group"
                >
                  <div class="flex-1 w-full relative">
                    <select
                      v-model="target.subjectId"
                      class="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none text-gray-800 font-medium appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Pilih Mapel...</option>
                      <option
                        v-for="sub in getAvailableSubjects(target.subjectId)"
                        :key="sub.id"
                        :value="sub.id"
                      >
                        {{ sub.name }}
                      </option>
                    </select>
                    <div
                      class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400"
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
                        />
                      </svg>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                    </div>
                  </div>

                  <div class="w-full md:w-48 relative flex items-center">
<<<<<<< HEAD
                    <button @click="target.targetHours = Math.max(0, target.targetHours - 1)" class="absolute left-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#014f01] hover:bg-[#014f01]/10 rounded-md transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/></svg>
                    </button>
                    
                    <input 
                      v-model.number="target.targetHours" 
                      type="number" 
                      class="w-full text-center px-10 py-2.5 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none text-gray-900 font-bold"
                      min="0"
                    />
                    
                    <button @click="target.targetHours++" class="absolute right-12 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#014f01] hover:bg-[#014f01]/10 rounded-md transition-colors">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    </button>
                    <span class="absolute right-4 text-sm font-medium text-gray-400 pointer-events-none">Jam</span>
                  </div>

                  <div class="w-full md:w-12 flex justify-end md:justify-center">
                    <button 
                      @click="removeSubject(index)" 
=======
                    <button
                      @click="target.targetHours = Math.max(0, target.targetHours - 1)"
                      class="absolute left-2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#014f01] hover:bg-[#014f01]/10 rounded-md transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M20 12H4"
                        />
                      </svg>
                    </button>

                    <input
                      v-model.number="target.targetHours"
                      type="number"
                      class="w-full text-center px-10 py-2.5 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:ring-2 focus:ring-[#014f01]/20 focus:border-[#014f01] outline-none text-gray-900 font-bold"
                      min="0"
                    />

                    <button
                      @click="target.targetHours++"
                      class="absolute right-12 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#014f01] hover:bg-[#014f01]/10 rounded-md transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </button>
                    <span
                      class="absolute right-4 text-sm font-medium text-gray-400 pointer-events-none"
                      >Jam</span
                    >
                  </div>

                  <div class="w-full md:w-12 flex justify-end md:justify-center">
                    <button
                      @click="removeSubject(index)"
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                      class="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                      title="Hapus Mapel"
                    >
                      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<<<<<<< HEAD
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
=======
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

<<<<<<< HEAD
              <button 
=======
              <button
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
                @click="addSubject"
                :disabled="getAvailableSubjects('').length === 0"
                class="w-full py-3.5 border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm rounded-xl hover:border-[#014f01] hover:text-[#014f01] hover:bg-[#014f01]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
<<<<<<< HEAD
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                {{ getAvailableSubjects('').length === 0 ? 'Semua Mapel Telah Ditambahkan' : 'Tambah Mata Pelajaran' }}
=======
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                {{
                  getAvailableSubjects('').length === 0
                    ? 'Semua Mapel Telah Ditambahkan'
                    : 'Tambah Mata Pelajaran'
                }}
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
              </button>
            </div>
          </section>
        </div>

        <section class="mt-8 mb-12 max-w-4xl mx-auto w-full">
<<<<<<< HEAD
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-[#014f01]/10 flex items-center justify-center text-[#014f01]">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total Beban</p>
              <p class="text-2xl font-black text-gray-800 leading-none">
                {{ totalHours }} <span class="text-sm font-semibold text-gray-500">Jam/Mgg</span>
              </p>
            </div>
          </div>
          
          <VButton 
            variant="primary" 
            :loading="loading" 
            @click="saveConfig" 
            class="w-full md:w-auto px-8 py-3.5 shadow-lg shadow-[#014f01]/30 rounded-xl font-bold text-sm"
          >
            Simpan Konfigurasi
          </VButton>
        </div>
      </section>
=======
          <div
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div class="flex items-center gap-4">
              <div
                class="w-12 h-12 rounded-xl bg-[#014f01]/10 flex items-center justify-center text-[#014f01]"
              >
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                  Total Beban
                </p>
                <p class="text-2xl font-black text-gray-800 leading-none">
                  {{ totalHours }} <span class="text-sm font-semibold text-gray-500">Jam/Mgg</span>
                </p>
              </div>
            </div>

            <VButton
              variant="primary"
              :loading="loading"
              @click="saveConfig"
              class="w-full md:w-auto px-8 py-3.5 shadow-lg shadow-[#014f01]/30 rounded-xl font-bold text-sm"
            >
              Simpan Konfigurasi
            </VButton>
          </div>
        </section>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
      </template>
    </main>

    <BaseModal :show="modalState.show" @close="closeModal">
      <template #header>
<<<<<<< HEAD
        <div v-if="modalState.type === 'success'" class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
          <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <div v-else-if="modalState.type === 'error'" class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
          <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <div v-else-if="modalState.type === 'confirm'" class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4">
          <svg class="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
=======
        <div
          v-if="modalState.type === 'success'"
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4"
        >
          <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div
          v-else-if="modalState.type === 'error'"
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4"
        >
          <svg class="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <div
          v-else-if="modalState.type === 'confirm'"
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 mb-4"
        >
          <svg
            class="h-8 w-8 text-orange-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900">{{ modalState.title }}</h3>
      </template>

      <template #body>
        <p class="text-sm text-gray-500 mt-2 whitespace-pre-line">
          {{ modalState.message }}
        </p>
      </template>

      <template #footer>
        <div class="mt-6 flex gap-3 justify-center">
          <template v-if="modalState.type === 'confirm'">
<<<<<<< HEAD
            <VButton variant="secondary" class="w-full justify-center" @click="closeModal">Batal</VButton>
            <VButton variant="primary" class="w-full justify-center !bg-red-600 hover:!bg-red-700 active:!bg-red-800" @click="modalState.onConfirm">Hapus</VButton>
          </template>
          <template v-else>
            <VButton variant="primary" class="w-full justify-center" @click="closeModal">Tutup</VButton>
=======
            <VButton variant="secondary" class="w-full justify-center" @click="closeModal"
              >Batal</VButton
            >
            <VButton
              variant="primary"
              class="w-full justify-center !bg-red-600 hover:!bg-red-700 active:!bg-red-800"
              @click="modalState.onConfirm"
              >Hapus</VButton
            >
          </template>
          <template v-else>
            <VButton variant="primary" class="w-full justify-center" @click="closeModal"
              >Tutup</VButton
            >
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6
          </template>
        </div>
      </template>
    </BaseModal>
<<<<<<< HEAD

  </div>
</template>
=======
  </div>
</template>
>>>>>>> 8060b4c18f8acbd1761af22f3b0b8ed43e8c7cb6

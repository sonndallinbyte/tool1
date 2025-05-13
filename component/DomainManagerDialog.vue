<script lang="ts" setup>
import {
  ElDialog,
  ElButton,
  ElMessageBox,
  ElInput,
  ElTable,
  ElTableColumn,
  ElMessage,
} from "element-plus";
import { ref, watch } from "vue";
import axios from "axios";

// Define props
const props = defineProps<{
  visible: boolean;
  title?: string;
  width?: string | number;
}>();

// Define emits
const emit = defineEmits<{
  (e: "update:visible", value: boolean): void;
  (e: "confirm"): void;
}>();

// Reactive state for domain management
const newDomain = ref("");
const domains = ref<string[]>([]);
const editingIndex = ref<number | null>(null);
const isLoading = ref(false);

// API endpoints
const API_URL_LIST = "https://screenshot.lattex.dev/api/scan-image-links/list-domain";
const API_URL_CREATE = "https://screenshot.lattex.dev/api/scan-image-links/create-domain";

// Fetch domains from API
const fetchDomains = async () => {
  isLoading.value = true;
  try {
    const response = await axios.get(API_URL_LIST);
    if (response.data.status === 200) {
      domains.value = response.data.data.map((item: any) => item.domain);
      ElMessage.success("Domains loaded successfully");
    } else {
      ElMessage.error("Failed to load domains");
    }
  } catch (error) {
    ElMessage.error("Error fetching domains: " + error);
  } finally {
    isLoading.value = false;
  }
};

// Watch for dialog visibility to fetch domains when dialog opens
watch(
  () => props.visible,
  (newValue) => {
    if (newValue) {
      fetchDomains();
    }
  },
  { immediate: true }
);

// Validate domain format (basic validation)
const isValidDomain = (domain: string): boolean => {
  const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/;
  return domainRegex.test(domain.trim());
};

// Create domain via API
const createDomain = async (domain: string) => {
  isLoading.value = true;
  try {
    const response = await axios.post(API_URL_CREATE, { domain });
    if (response.data.status === 200) {
      ElMessage.success("Domain created successfully");
      // Add the new domain to the list
      domains.value.push(domain);
      return true;
    } else {
      ElMessage.error(response.data.message || "Failed to create domain");
      return false;
    }
  } catch (error: any) {
    ElMessage.error("Error creating domain: " + (error.response?.data?.message || error.message));
    return false;
  } finally {
    isLoading.value = false;
  }
};

// Handle adding or updating domain
const handleAddOrUpdateDomain = async () => {
  const domain = newDomain.value.trim();
  if (!domain) {
    ElMessage.error("Please enter a domain");
    return;
  }

  if (!isValidDomain(domain)) {
    ElMessage.error("Please enter a valid domain");
    return;
  }

  if (editingIndex.value !== null) {
    // Update existing domain
    domains.value[editingIndex.value] = domain;
    ElMessage.success("Domain updated successfully");
    editingIndex.value = null;
  } else {
    // Add new domain
    if (domains.value.includes(domain)) {
      ElMessage.error("Domain already exists");
      return;
    }
    
    // Call API to create domain
    const success = await createDomain(domain);
    if (success) {
      newDomain.value = "";
    }
  }
};

// Handle editing a domain
const handleEditDomain = (index: number) => {
  editingIndex.value = index;
  newDomain.value = domains.value[index];
};

// Handle deleting a domain
const handleDeleteDomain = (index: number) => {
  ElMessageBox.confirm(
    "Are you sure you want to delete this domain?",
    "Warning",
    {
      confirmButtonText: "OK",
      cancelButtonText: "Cancel",
      type: "warning",
    }
  )
    .then(() => {
      domains.value.splice(index, 1);
      ElMessage.success("Domain deleted successfully");
      if (editingIndex.value === index) {
        editingIndex.value = null;
        newDomain.value = "";
      }
    })
    .catch(() => {});
};

// Handle dialog close with confirmation
const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure to close this dialog?")
    .then(() => {
      done();
    })
    .catch(() => {});
};

// Handle confirm action
const handleConfirm = () => {
  emit("confirm");
  emit("update:visible", false);
};

// Handle cancel action
const handleCancel = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    :title="props.title || 'Domain Manager'"
    :width="props.width || '1500px'"
    :before-close="handleClose"
    @update:model-value="emit('update:visible', $event)"
    class="rounded-lg shadow-xl"
  >
    <!-- Input and Add/Update Button -->
    <div class="mb-6 flex flex-col sm:flex-row gap-4">
      <el-input
        v-model="newDomain"
        placeholder="Enter domain (e.g., example.com)"
        clearable
        class="w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
        @keyup.enter="handleAddOrUpdateDomain"
      />
      <el-button
        type="primary"
        @click="handleAddOrUpdateDomain"
        :loading="isLoading"
        :disabled="!newDomain.trim() || isLoading"
        class="rounded-md px-6 py-2 text-sm font-semibold"
      >
        {{ editingIndex !== null ? "Update Domain" : "Add Domain" }}
      </el-button>
    </div>

    <!-- Domains Table -->
    <el-table
      :data="domains"
      v-loading="isLoading"
      style="width: 100%"
      class="border border-gray-300 rounded-lg overflow-hidden"
      :header-cell-class-name="'bg-gray-100 text-gray-700 font-semibold border-b border-gray-300 text-left px-4 py-3'"
      :cell-class-name="'border-b border-r border-gray-300 px-4 py-3 last:border-r-0'"
      :row-class-name="'hover:bg-gray-50 transition-colors duration-200'"
    >
      <el-table-column prop="domain" label="Domain" min-width="300" align="left">
        <template #default="{ row }">
          <a
            :href="`http://${row}`"
            target="_blank"
            class="text-indigo-600 hover:text-indigo-800 hover:underline font-medium truncate block"
          >
            {{ row }}
          </a>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="200" align="right">
        <template #default="{ $index }">
          <div class="flex gap-2 justify-end">
            <el-button
              type="warning"
              size="small"
              @click="handleEditDomain($index)"
              :disabled="editingIndex !== null && editingIndex !== $index || isLoading"
              class="rounded-md px-4 py-1 text-sm"
            >
              Edit
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDeleteDomain($index)"
              :disabled="isLoading"
              class="rounded-md px-4 py-1 text-sm"
            >
              Delete
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
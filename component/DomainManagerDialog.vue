<script lang="ts" setup>
import { ElDialog, ElButton, ElMessageBox } from "element-plus";

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

// Handle dialog close with confirmation
const handleClose = (done: () => void) => {
  ElMessageBox.confirm("Are you sure to close this dialog?")
    .then(() => {
      done();
    })
    .catch(() => {
      // Handle cancel
    });
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
    :width="props.width || '1500'"
    :before-close="handleClose"
    @update:model-value="emit('update:visible', $event)"
  >
    <span>This is a message</span>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">Cancel</el-button>
        <el-button type="primary" @click="handleConfirm">Confirm</el-button>
      </div>
    </template>
  </el-dialog>
</template>
<template>
  <v-card title="Sign In">
    <v-card-text>
      <v-alert :value="!!error" type="error">
        {{ error }}
      </v-alert>
      <v-form>
        <v-text-field
          v-model="formEmail"
          label="Login"
          name="login"
          prepend-icon="mdi-account-circle"
          type="text"
        />

        <v-text-field
          v-model="formPassword"
          :type="showPassword ? 'text' : 'password'"
          label="Password"
          prepend-icon="mdi-lock"
          :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append="showPassword = !showPassword"
        />
        <v-btn color="primary" @click="emailLogin"> Login </v-btn>
      </v-form>
    </v-card-text>
    <template slot="actions">
      <v-spacer />
    </template>
  </v-card>
</template>

<script>
export default {
  layout: 'centered',
  data() {
    return {
      formEmail: '',
      formPassword: '',
      showPassword: false,
      error: null,
    }
  },
  methods: {
    async emailLogin() {
      try {
        await this.$fire.auth.signInWithEmailAndPassword(
          this.formEmail,
          this.formPassword
        )
      } catch (error) {
        this.error = error.message
      }
    },
  },
}
</script>

<style></style>

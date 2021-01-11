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
    emailRegister() {
      this.$store
        .dispatch('auth/registerWithEmail', {
          email: this.formEmail,
          password: this.formPassword,
        })
        .catch((e) => {
          this.error = e.message
        })
    },
    async emailLogin() {
      try {
        const user = await this.$store.dispatch('auth/signInWithEmail', {
          email: this.formEmail,
          password: this.formPassword,
        })
        await this.$store.dispatch('auth/changeUserData', user)
        console.log(user)
      } catch (error) {
        this.error = error.message
      }
    },
    googleSignUp() {
      this.$store.dispatch('auth/signInWithGoogle').catch((e) => {
        this.error = e.message
      })
    },
  },
}
</script>

<style></style>

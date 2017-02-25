pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                sh 'npm install'
                sh 'cd public'
                sh 'bower install'
                sh 'cd ..'
            }
        }
        stage('Test') {
            steps {
                sh 'npm run test'
                sh 'npm run coverage'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
